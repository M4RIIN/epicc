import { devices, expect, test } from '@playwright/test';

test('les paragraphes de la biographie démarrent ensemble lettre par lettre', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator('#a-propos')
    .evaluate((biography) => biography.scrollIntoView({ behavior: 'instant' }));
  const chapters = page.locator('.vitrine-chapters > p');
  await expect(chapters.first()).toHaveAttribute(
    'data-biography-writing',
    'started',
  );
  await expect(chapters.nth(1)).toHaveAttribute(
    'data-biography-writing',
    'started',
  );

  const frames = await chapters.evaluateAll(async ([first, second]) => {
    const highlight = CSS.highlights.get('biography-writing')!;
    const frames: number[][] = [];
    for (let frame = 0; frame < 12 && frames.length < 2; frame++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const ranges = [...highlight];
      const lengths = [first, second].map(
        (chapter) =>
          ranges
            .find((range) => chapter!.contains(range.startContainer))
            ?.toString().length ?? 0,
      );
      if (lengths.every(Boolean) && lengths[0] !== frames.at(-1)?.[0]) {
        frames.push(lengths);
      }
    }
    return frames;
  });

  expect(frames).toHaveLength(2);
  for (const [first, second] of frames) expect(first).toBe(second);
  expect(frames[1]![0]).toBeGreaterThan(frames[0]![0]!);
});

test('sur mobile, le récit sous la photo attend son arrivée à l’écran', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  const question = page.locator('.vitrine-biography-question');
  const firstChapter = page.locator('.vitrine-chapters > p').first();
  await question.evaluate((paragraph) => {
    window.scrollTo({
      top: scrollY + paragraph.getBoundingClientRect().top - innerHeight + 120,
      behavior: 'instant',
    });
  });
  await expect(question).toHaveAttribute('data-biography-writing', 'started');
  await expect(firstChapter).not.toBeInViewport();
  await expect(firstChapter).toHaveAttribute(
    'data-biography-writing',
    'pending',
  );
  await expect(firstChapter).toHaveCSS('color', 'rgba(0, 0, 0, 0)');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(firstChapter).toHaveCSS('color', 'rgb(0, 0, 0)');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await firstChapter.scrollIntoViewIfNeeded();
  await expect(firstChapter).toHaveAttribute(
    'data-biography-writing',
    'started',
  );
  await expect(firstChapter).toHaveAttribute(
    'data-biography-writing',
    'finished',
  );
  await expect(firstChapter).toHaveCSS('color', 'rgb(0, 0, 0)');
  await question.scrollIntoViewIfNeeded();
  await firstChapter.scrollIntoViewIfNeeded();
  await expect(firstChapter).toHaveAttribute(
    'data-biography-writing',
    'finished',
  );
});

test('le manifeste alterne ses phrases avec un glitch et anime le collage en boucle', async ({
  page,
}) => {
  await page.goto('/#epicc');
  const manifesto = page.locator('#epicc');
  await expect(manifesto).toHaveClass(/vitrine-manifesto-animated/);
  await page.evaluate(() => document.fonts.ready);

  const definition = manifesto.locator('.vitrine-manifesto-definition');
  await expect(definition).toHaveClass(/vitrine-manifesto-rotating/);
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const { positions, activePhrases, glitchShifts } =
      await definition.evaluate((element) => {
        const phrases = [...element.children];
        const animations = element.getAnimations({ subtree: true });
        for (const animation of animations) animation.pause();

        const positions = phrases.map((phrase) => {
          const range = document.createRange();
          range.selectNode(phrase.firstChild!);
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
            return [...phrase.children].map((band) => {
              const { visibility, clipPath, textIndent } =
                getComputedStyle(band);
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
  const collageFrames = await collage.evaluate((element) => {
    const pieces = ['beau', 'bon', 'bien'].map((word) =>
      element.querySelector(`.vitrine-collage-${word}`)!,
    );
    const animations = pieces.map((piece) => piece.getAnimations()[0]!);
    for (const animation of animations) animation.pause();

    return [1300, 2700, 4100, 7300, 8700, 10100, 11300, 12700, 14100].map(
      (time) => {
        for (const animation of animations) animation.currentTime = time;
        return pieces.map((piece) => getComputedStyle(piece).opacity);
      },
    );
  });
  expect(collageFrames).toEqual([
    ['1', '0', '0'],
    ['1', '1', '0'],
    ['1', '1', '1'],
    ['0', '1', '1'],
    ['0', '0', '1'],
    [expect.stringMatching(/^0\./), '0', '0'],
    ['1', '0', '0'],
    ['1', '1', '0'],
    ['1', '1', '1'],
  ]);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await collage.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  const staticPhrases = await definition.evaluate((element) =>
    [...element.children].map((phrase) => ({
      clip: getComputedStyle(phrase).clipPath,
      bands: [...phrase.children].map((band) => getComputedStyle(band).display),
    })),
  );
  expect(staticPhrases).toEqual(
    Array.from({ length: 4 }, () => ({
      clip: 'none',
      bands: ['none', 'none'],
    })),
  );
});

test.describe('manifeste sur mobile', () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } =
    devices['Pixel 7'];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  test('le glitch se lance quand la ligne entre à l’écran', async ({
    page,
  }) => {
    await page.goto('/');
    const manifesto = page.locator('#epicc');
    const definition = manifesto.locator('.vitrine-manifesto-definition');

    await manifesto.evaluate((section) => {
      window.scrollTo({
        top: scrollY + section.getBoundingClientRect().top - innerHeight + 150,
        behavior: 'instant',
      });
    });
    await expect(manifesto).toHaveClass(/vitrine-manifesto-animated/);
    await expect(definition).not.toBeInViewport();
    await expect(definition).not.toHaveClass(/vitrine-manifesto-rotating/);

    await definition.scrollIntoViewIfNeeded();
    await expect(definition).toBeInViewport({ ratio: 1 });
    await expect
      .poll(
        () =>
          definition.locator('.vitrine-glitch-band').evaluateAll(
            (bands) =>
              bands.filter((band) => {
                const { visibility, clipPath } = getComputedStyle(band);
                return (
                  visibility === 'visible' && clipPath.startsWith('inset(')
                );
              }).length,
          ),
        { intervals: [50], timeout: 3000 },
      )
      .toBe(2);
  });
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
