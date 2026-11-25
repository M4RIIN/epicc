import { expect, test } from '@playwright/test';

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
  test(`le portfolio défile avec la page, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      for (const width of [1920, 1440, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/#projets');
        const portfolio = page.getByRole('region', {
          name: 'Les projets clients',
        });
        const heading = portfolio.getByRole('heading', {
          name: 'Les projets clients',
        });
        const firstProject = portfolio.getByRole('figure', {
          name: 'Amafolia',
          exact: true,
        });
        const club = portfolio.getByRole('figure', { name: 'Club des Biches' });
        const lastProject = portfolio.getByRole('figure', {
          name: 'Fitness by Leslie',
        });

        await expect(heading).toBeInViewport();
        await expect(portfolio.getByRole('figure')).toHaveCount(13);
        await expect(firstProject.getByText('Octobre 2026')).toBeVisible();
        await expect(
          club.getByText('Événementiel · Réseaux sociaux'),
        ).toBeVisible();
        await expect(club.getByRole('img')).toHaveCount(1);
        await expect(lastProject).not.toBeInViewport();

        const gallery = portfolio.locator('.vitrine-projects-collage');
        await expect(gallery).toHaveCSS('overflow-y', 'visible');
        await lastProject.scrollIntoViewIfNeeded();
        await expect(lastProject).toBeInViewport();
        await expect(heading).not.toBeInViewport();

        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        const footer = page.getByRole('contentinfo');
        expect((await footer.boundingBox())?.width).toBe(width);
        await expect(
          footer.getByRole('link', { name: 'EPICC, retour en haut' }),
        ).toBeInViewport();
      }
    } finally {
      await context.close();
    }
  });
}

test('les colonnes du portfolio conservent le décalage de la maquette sur ordinateur', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto('/#projets');
  const amafolia = page.getByRole('figure', { name: 'Amafolia', exact: true });
  const [starter, pasta] = await Promise.all([
    amafolia
      .getByRole('img', { name: 'Entrée dressée pour Amafolia.' })
      .boundingBox(),
    amafolia
      .getByRole('img', { name: 'Assiette de pâtes chez Amafolia.' })
      .boundingBox(),
  ]);
  expect(starter).toBeTruthy();
  expect(pasta).toBeTruthy();
  expect(starter!.y - pasta!.y).toBeCloseTo(75, 0);
  expect(pasta!.x - starter!.x - starter!.width).toBeCloseTo(65, 0);
});
