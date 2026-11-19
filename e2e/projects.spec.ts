import { expect, test } from '@playwright/test';

test('les fiches clients gardent leur aperçu au pointeur et au clavier', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#projets');

  for (const { name, screenshot } of [
    { name: 'Amafolia', screenshot: /apercu-amafolia/ },
    { name: 'Viandes des Sommets', screenshot: /apercu-viandes-des-sommets/ },
  ]) {
    const radio = page.getByRole('radio', { name, exact: true });
    await radio.focus();
    await radio.press('Space');

    const project = page.getByRole('figure', { name, exact: true });
    const link = project.getByRole('link');
    const preview = project.locator('.vitrine-project-preview');
    await expect(preview).toHaveCSS('opacity', '0');
    await link.hover();
    await expect(preview).toHaveCSS('opacity', '1');
    await expect(preview).toBeInViewport({ ratio: 1 });
    const linkBox = (await link.boundingBox())!;
    const mouseX = Math.round(linkBox.x + linkBox.width / 2) + 12;
    const mouseY = Math.round(linkBox.y + linkBox.height / 2);
    await page.mouse.move(mouseX, mouseY);
    const previewBox = (await preview.boundingBox())!;
    expect(previewBox.x + previewBox.width / 2).toBeCloseTo(mouseX, 0);
    expect(
      Math.abs(mouseY - (previewBox.y + previewBox.height) - 24),
    ).toBeLessThan(2);
    const image = preview.locator('img');
    await expect(image).toHaveAttribute('src', screenshot);
    await image.evaluate((element) => (element as HTMLImageElement).decode());
    await page.mouse.move(0, 0);
    await expect(preview).toHaveCSS('opacity', '0');

    await radio.focus();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await expect(preview).toHaveCSS('opacity', '1');
    await expect(preview).toHaveCSS('position', 'absolute');
    await link.blur();
    await expect(preview).toHaveCSS('opacity', '0');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(preview).toHaveCSS('transition-duration', '0s');
    await expect(
      project.locator('.vitrine-project-photos img').first(),
    ).toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});

test('les douze projets sont accessibles directement sans JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#projets');
    const catalogue = page.getByRole('group', { name: 'Projet à afficher' });
    const choices = catalogue.getByRole('radio');
    await expect(choices).toHaveCount(12);
    await expect(choices.first()).toBeChecked();

    const labels = catalogue.locator('label');
    const initialScroll = await page.evaluate(() => scrollY);
    const initialHeight = (await catalogue.boundingBox())!.height;
    for (const label of await labels.all()) {
      const name = (await label.textContent())!.replace(/^\d+/, '');
      await label.tap();
      await expect(
        catalogue.getByRole('radio', { name, exact: true }),
      ).toBeChecked();
      await expect(catalogue.getByRole('figure')).toHaveCount(1);
      const spread = catalogue.getByRole('figure', { name, exact: true });
      const photos = spread.locator('.vitrine-project-photos img');
      await expect(photos).toHaveCount(2);
      for (const photo of await photos.all()) {
        await expect
          .poll(() =>
            photo.evaluate((image: HTMLImageElement) => image.naturalWidth),
          )
          .toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => scrollY)).toBe(initialScroll);
      expect((await catalogue.boundingBox())!.height).toBe(initialHeight);
    }

    const last = choices.last();
    await last.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(
      catalogue.getByRole('radio', { name: 'La Grinta' }),
    ).toBeChecked();
    await expect(
      catalogue.getByRole('figure', { name: 'La Grinta' }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test('la molette traverse le catalogue sans défilement interne', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [
    { width: 2560, height: 900 },
    { width: 1440, height: 900 },
    { width: 768, height: 680 },
    { width: 375, height: 667 },
    { width: 320, height: 667 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/#projets');
    const catalogue = page.getByRole('region', { name: 'Les projets clients' });
    await expect(catalogue).toBeInViewport({ ratio: 0.99 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const initialScroll = await page.evaluate(() => scrollY);
    const { x, y, width, height } = (await catalogue.boundingBox())!;
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.wheel(0, 110);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBe(initialScroll + 110);
    await expect(page.getByRole('radio', { name: 'Amafolia' })).toBeChecked();

    await page.mouse.wheel(0, viewport.height);
    await expect(catalogue).not.toBeInViewport();
    await expect(page.locator('#contact')).toBeInViewport();
  }
});
