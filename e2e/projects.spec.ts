import { expect, test } from '@playwright/test';

test('le défilement de la page anime l’entrée, l’alignement et la sortie des lettrages', async ({
  page,
}) => {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#projets');
    const gallery = page.getByRole('group', {
      name: 'Liste des projets clients',
    });
    const header = page.locator('.vitrine-projects-header');
    const headerHeight = (await header.boundingBox())!.height;

    for (const { name, direction } of [
      { name: 'Le Conseil', direction: width > 700 ? 1 : -1 },
      { name: 'Deux Main', direction: -1 },
    ]) {
      const row = gallery.getByRole('figure', { name, exact: true });
      const caption = row.locator('.vitrine-project-names');
      const geometry = await row.evaluate((element) => {
        const row = element.getBoundingClientRect();
        return {
          top: row.top + scrollY,
          height: row.height,
          viewHeight: innerHeight,
        };
      });
      const { top, height, viewHeight } = geometry;
      const scrollTo = (offset: number) =>
        page.evaluate(async (y) => {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
        }, offset);
      const readCaption = () =>
        caption.evaluate((element) => {
          const { translate, opacity } = getComputedStyle(element);
          const [x, y = 0] = translate.split(' ').map(Number.parseFloat);
          return {
            x: Math.round(x!),
            y: Math.round(y),
            opacity: Number(opacity),
          };
        });

      await scrollTo(top - viewHeight + height * 0.44);
      const entry = await readCaption();
      expect(entry.x * direction).toBeGreaterThan(0);
      expect(entry.y).toBeGreaterThan(0);
      expect(entry.opacity).toBeGreaterThan(0);
      expect(entry.opacity).toBeLessThan(1);

      const aligned = top - (viewHeight + headerHeight - height) / 2;
      await scrollTo(aligned);
      expect(await readCaption()).toEqual({ x: 0, y: 0, opacity: 1 });

      await scrollTo(top - headerHeight + height * 0.44);
      const exit = await readCaption();
      expect(exit.x * direction).toBeGreaterThan(0);
      expect(exit.y).toBeLessThan(0);
      expect(exit.opacity).toBeGreaterThan(0);
      expect(exit.opacity).toBeLessThan(entry.opacity);

      await scrollTo(top - headerHeight + height * 0.69);
      await expect(caption).toHaveCSS('opacity', '0');

      await scrollTo(aligned);
      expect(await readCaption()).toEqual({ x: 0, y: 0, opacity: 1 });

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(caption).toHaveCSS('translate', 'none');
      await expect(caption).toHaveCSS('opacity', '1');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
  }
});

test('les fiches clients affichent leur aperçu au survol et au clavier', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#projets');

  for (const { name, screenshot } of [
    { name: 'Amafolia', screenshot: /apercu-amafolia/ },
    { name: 'Viandes des Sommets', screenshot: /apercu-viandes-des-sommets/ },
  ]) {
    const project = page.getByRole('figure', { name, exact: true });
    const link = project.getByRole('link').first();
    const preview = project.locator('.vitrine-project-preview');
    await expect(preview).toHaveCSS('opacity', '0');
    await link.hover();
    await expect(preview).toHaveCSS('opacity', '1');
    await expect(preview).toBeInViewport({ ratio: 1 });
    const linkBox = (await link.boundingBox())!;
    const mouseX = Math.round(linkBox.x + linkBox.width / 2) + 16;
    const mouseY = Math.round(linkBox.y + linkBox.height / 2);
    await page.mouse.move(mouseX, mouseY);
    const previewBox = (await preview.boundingBox())!;
    expect(previewBox.x + previewBox.width / 2).toBeCloseTo(mouseX, 0);
    expect(
      mouseY < previewBox.y
        ? previewBox.y - mouseY
        : mouseY - (previewBox.y + previewBox.height),
    ).toBeLessThanOrEqual(56);
    const image = preview.locator('img');
    await expect(image).toHaveAttribute('src', screenshot);
    await image.evaluate((element) => (element as HTMLImageElement).decode());
    await page.mouse.move(0, 0);
    await expect(preview).toHaveCSS('opacity', '0');

    await page.keyboard.press('Tab');
    await link.focus();
    await expect(preview).toHaveCSS('opacity', '1');
    await expect(preview).toHaveCSS('position', 'absolute');
    await link.blur();
    await expect(preview).toHaveCSS('opacity', '0');
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.vitrine-project-preview').first()).toHaveCSS(
    'transition-duration',
    '0s',
  );
});

for (const javaScriptEnabled of [false, true]) {
  test(`la page défile des projets au contact, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }) => {
    const page = await browser.newPage({
      javaScriptEnabled,
      reducedMotion: 'reduce',
    });
    try {
      for (const viewport of [
        { width: 2560, height: 900 },
        { width: 1440, height: 900 },
        { width: 375, height: 667 },
        { width: 320, height: 580 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto('/#projets');
        const section = page.getByRole('region', {
          name: 'Les projets clients',
        });
        const title = section.getByRole('heading', {
          name: 'Les projets clients',
        });
        const gallery = section.getByRole('group', {
          name: 'Liste des projets clients',
        });
        const lastProject = gallery.getByRole('figure', {
          name: 'Fitness by Leslie',
        });
        const contact = page.getByRole('region', { name: 'Contact' });
        const start = await page.evaluate(() => scrollY);
        await expect(gallery).toHaveCSS('overflow-y', 'visible');
        await expect(title).toBeInViewport({ ratio: 1 });
        await expect(lastProject).not.toBeInViewport();

        const photo = gallery.locator('.vitrine-project-photo').first();
        const photoBox = (await photo.boundingBox())!;
        await page.mouse.move(photoBox.x + photoBox.width / 2, photoBox.y + 12);
        await page.mouse.wheel(0, 180);
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(start + 180);
        await expect(title).toBeInViewport({ ratio: 1 });
        expect(await gallery.evaluate((element) => element.scrollTop)).toBe(0);

        await lastProject.scrollIntoViewIfNeeded();
        await expect(lastProject).toBeInViewport();
        await page.mouse.wheel(0, Math.round(viewport.height * 0.55));
        await expect(contact).toBeInViewport();

        await page.evaluate((y) => window.scrollTo(0, y), start + 180);
        const link = section.getByRole('link', { name: 'Contact' });
        await expect(link).toBeInViewport({ ratio: 1 });
        await link.press('Enter');
        await expect(page).toHaveURL('/#contact');
        await expect(contact).toBeInViewport();
        await expect(contact).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByLabel('Nom', { exact: true })).toBeFocused();

        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        const footer = page.getByRole('contentinfo');
        await expect
          .poll(() =>
            footer.evaluate((element) =>
              Math.abs(innerHeight - element.getBoundingClientRect().bottom),
            ),
          )
          .toBeLessThan(1);
      }
    } finally {
      await page.close();
    }
  });

  test(`clients sur une ligne avec deux photos maximum, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      javaScriptEnabled,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('.vitrine-project')).toHaveCount(12);
      await expect(page.locator('.vitrine-opening-number')).toHaveCount(0);
      await expect(
        page.getByRole('figure', { name: 'Amafolia', exact: true }),
      ).toHaveAttribute('data-side', 'right');
      await expect(
        page.getByRole('figure', { name: 'Viandes des Sommets', exact: true }),
      ).toHaveAttribute('data-side', 'left');
      await expect(
        page.getByRole('figure', { name: 'L’Écluse Douze', exact: true }),
      ).toHaveAttribute('data-side', 'right');
      const viande = page.getByRole('figure', {
        name: 'Viandes des Sommets',
        exact: true,
      });
      await expect(viande.locator('.vitrine-project-photo')).toHaveCount(2);
      await expect(
        viande.locator('.vitrine-project-photo').first(),
      ).toHaveAttribute('data-file', 'Rectangle6.png');
      for (const width of [1920, 1440, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const rows = await page
          .locator('.vitrine-project')
          .evaluateAll((projects) =>
            projects.map((project) => {
              const title = project
                .querySelector('.vitrine-project-names')!
                .getBoundingClientRect();
              const photos = Array.from(
                project.querySelector('.vitrine-project-photos')!.children,
              ).map((photo) => {
                const rect = photo.getBoundingClientRect();
                return {
                  x: rect.x,
                  right: rect.right,
                  y: rect.y,
                  bottom: rect.bottom,
                };
              });
              return {
                title: {
                  x: title.x,
                  right: title.right,
                  y: title.y,
                  bottom: title.bottom,
                },
                side: project.getAttribute('data-side'),
                photos,
              };
            }),
          );
        for (const { title, photos, side } of rows) {
          expect(photos.length).toBeLessThanOrEqual(2);
          if (width > 700 && side === 'right') {
            expect(title.x).toBeGreaterThan(photos.at(-1)!.right);
            expect(title.x - photos.at(-1)!.right).toBeLessThan(width * 0.02);
          } else {
            expect(photos[0]!.x).toBeGreaterThan(title.right);
            if (width > 700)
              expect(photos[0]!.x - title.right).toBeLessThan(width * 0.02);
          }
          expect(
            Math.abs(
              (title.y + title.bottom) / 2 -
                (photos[0]!.y + photos[0]!.bottom) / 2,
            ),
          ).toBeLessThan(1);
          if (photos[1]) {
            expect(photos[1].x).toBeGreaterThan(photos[0]!.right);
            expect(
              Math.abs(
                (photos[1].y + photos[1].bottom) / 2 -
                  (photos[0]!.y + photos[0]!.bottom) / 2,
              ),
            ).toBeLessThan(1);
          }
        }
        if (width > 700) {
          const seam = rows[0]!.photos[0]!.right;
          for (const { photos } of rows) {
            expect(Math.abs(photos[0]!.right - seam)).toBeLessThan(1);
            expect(photos[1]!.x - photos[0]!.right).toBeLessThan(width * 0.02);
            for (const photo of photos)
              expect(photo.right - photo.x).toBeLessThan(width * 0.19);
          }
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (javaScriptEnabled && [1920, 1440, 375].includes(width)) {
          await page.locator('#projets img').evaluateAll(async (elements) => {
            await Promise.all(
              elements.map(async (element) => {
                const image = element as HTMLImageElement;
                image.loading = 'eager';
                await image.decode();
              }),
            );
          });
          await page
            .locator('#projets')
            .screenshot({ path: testInfo.outputPath(`projets-${width}.png`) });
        }
      }
    } finally {
      await context.close();
    }
  });
}
