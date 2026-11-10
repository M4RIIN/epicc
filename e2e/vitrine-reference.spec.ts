import { expect, test } from '@playwright/test';

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
          page
            .locator('.vitrine-service-name')
            .getByText(name, { exact: true }),
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
      await expect(page).toHaveURL('/clients/viandes-des-sommets');
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
