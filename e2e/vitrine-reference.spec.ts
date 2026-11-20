import { expect, test } from '@playwright/test';

test('le manifeste alterne ses phrases avec un glitch et espace les apparitions du collage', async ({
  page,
}) => {
  await page.goto('/#epicc');
  const manifesto = page.locator('#epicc');
  await expect(manifesto).toHaveClass(/vitrine-manifesto-animated/);
  await page.evaluate(() => document.fonts.ready);

  const definition = manifesto.locator('.vitrine-manifesto-definition');
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const { positions, activePhrases, glitchShifts } =
      await definition.evaluate((element) => {
        const phrases = [...element.children];
        const animations = element.getAnimations({ subtree: true });
        for (const animation of animations) animation.pause();

        const positions = phrases.map((phrase) => {
          const range = document.createRange();
          range.selectNodeContents(phrase);
          const { x, y, right } = range.getBoundingClientRect();
          return { x, y, right, lines: range.getClientRects().length };
        });
        const seekAnimation = (time: number) => {
          for (const animation of animations) animation.currentTime = time;
        };
        const activePhrases = [600, 2400, 4200, 6000, 7800].map((time) => {
          seekAnimation(time);
          return phrases.flatMap((phrase, index) =>
            getComputedStyle(phrase).clipPath.includes('100%') ? [] : [index],
          );
        });
        const glitchShifts = phrases.map((phrase, index) =>
          [1400, 1480, 1570, 1660, 1750, 1810].map((offset) => {
            seekAnimation(index * 1800 + offset);
            return ['::before', '::after'].map((band) => {
              const { visibility, clipPath, textIndent } = getComputedStyle(
                phrase,
                band,
              );
              return visibility === 'visible' && clipPath.startsWith('inset(')
                ? parseFloat(textIndent)
                : 0;
            });
          }),
        );
        return { positions, activePhrases, glitchShifts };
      });

    expect(activePhrases).toEqual([[0], [1], [2], [3], [0]]);
    for (const shifts of glitchShifts) {
      expect(shifts.map((bands) => bands.map(Math.sign))).toEqual([
        [0, 0],
        [1, -1],
        [-1, 1],
        [1, -1],
        [-1, 1],
        [0, 0],
      ]);
      expect(shifts[3]![0]).toBeGreaterThanOrEqual(8);
    }
    for (const position of positions) {
      expect(position.lines).toBe(1);
      expect(position.x).toBe(positions[0]!.x);
      expect(position.y).toBe(positions[0]!.y);
      expect(position.right).toBeLessThanOrEqual(width);
    }
  }

  const collage = manifesto.locator('.vitrine-manifesto-collage');
  const revealDelays = await collage.evaluate((element) =>
    ['beau', 'bon', 'bien'].map((word) => {
      const piece = element.querySelector(`.vitrine-collage-${word}`)!;
      return piece.getAnimations()[0]!.effect!.getTiming().delay;
    }),
  );
  expect(revealDelays).toEqual([0, 1400, 2800]);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const staticPhrases = await definition.evaluate((element) =>
    [...element.children].map((phrase) => ({
      clip: getComputedStyle(phrase).clipPath,
      bands: ['::before', '::after'].map(
        (band) => getComputedStyle(phrase, band).content,
      ),
    })),
  );
  expect(staticPhrases).toEqual(
    Array.from({ length: 4 }, () => ({
      clip: 'none',
      bands: ['none', 'none'],
    })),
  );
});

for (const javaScriptEnabled of [false, true]) {
  test(`la vitrine actualisée conserve ses contenus et son parcours, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }, testInfo) => {
    test.setTimeout(90000);
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/');
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
      });
      await expect(page.locator('.vitrine-service')).toHaveCount(6);
      for (const name of [
        'Lancement de marque',
        'Restructuration d’identité',
        'Création de contenus visuels',
        'Réseaux sociaux',
        'Graphisme',
        'Événementiel & scénographie',
      ]) {
        await expect(
          page.locator('.vitrine-service').getByText(name, { exact: true }),
        ).toBeVisible();
      }
      await expect(
        page.getByRole('figure', { name: 'Viandes des Sommets', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('figure', { name: 'Amafolia', exact: true }),
      ).toBeVisible();
      const images = page.locator('.vitrine img');
      await images.evaluateAll(async (elements) => {
        await Promise.all(
          elements.map(async (element) => {
            const image = element as HTMLImageElement;
            image.loading = 'eager';
            await image.decode();
          }),
        );
      });
      for (const width of [1920, 1440, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (javaScriptEnabled && [1920, 375].includes(width)) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              ),
          );
          await page.locator('.vitrine img').evaluateAll(async (elements) => {
            await Promise.all(
              elements.map(async (element) => {
                const image = element as HTMLImageElement;
                image.loading = 'eager';
                await image.decode();
              }),
            );
          });
          await page.screenshot({
            path: testInfo.outputPath(`vitrine-${width}.png`),
            fullPage: true,
          });
        }
      }
      await page
        .getByRole('link', {
          name: 'Viandes des Sommets — découvrir l’identité visuelle',
        })
        .first()
        .click();
      await expect(page).toHaveURL('/clients/viandes-des-sommets/');
      await page.getByRole('link', { name: 'Tous les projets' }).click();
      await expect(page).toHaveURL('/#projets');
      await page.getByText('Menu', { exact: true }).click();
      await page.getByRole('link', { name: 'Contact', exact: true }).click();
      await page.getByLabel('Nom', { exact: true }).fill('Exemple');
      await page.getByLabel('Prénom', { exact: true }).fill('Camille');
      await page
        .getByLabel('Demande', { exact: true })
        .fill('Une demande de test.');
      await expect(page.locator('.vitrine-contact-form')).toHaveAttribute(
        'action',
        'mailto:test@questboard.test',
      );
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
