import { expect, test } from '@playwright/test';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
  'base64',
);

for (const javaScriptEnabled of [false, true]) {
  test(`image de survol administrable sans déplacer les offres, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled });
    const page = await context.newPage();
    const edit = '/connect/offres/creation-de-marque';
    try {
      await page.goto('/connect');
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Gérer les clients',
      );
      await page.goto(edit);
      const form = page.getByRole('form', {
        name: 'Image de survol',
        exact: true,
      });
      await form.getByLabel('Description du visuel de survol').fill('');
      await form.getByLabel('Importer le visuel de survol').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: png,
      });
      await form.getByRole('button', { name: 'Enregistrer le survol' }).click();
      await expect(form.getByRole('alert')).toContainText(
        'Décrivez l’image de survol',
      );
      let first: string | null = null;
      for (const alt of [
        'Premier visuel de survol',
        'Visuel de survol remplacé',
      ]) {
        await page.goto(edit);
        await form.getByLabel('Description du visuel de survol').fill(alt);
        await form.getByLabel('Importer le visuel de survol').setInputFiles({
          name: 'test.png',
          mimeType: 'image/png',
          buffer: png,
        });
        await form
          .getByRole('button', { name: 'Enregistrer le survol' })
          .click();
        await expect(page).toHaveURL('/connect');
        await page.goto('/');
        const offer = page.locator('[data-offer="creation-de-marque"]');
        const preview = offer.locator('.vitrine-offer-hover');
        await expect(preview).toBeHidden();
        await expect(preview.locator('img')).toHaveAttribute('alt', alt);
        const current = (await preview.locator('img').getAttribute('src'))!;
        expect((await page.request.get(current)).status()).toBe(200);
        expect((await page.request.get(`${current}?w=320&v=1`)).status()).toBe(
          200,
        );
        if (first) {
          expect(current).not.toBe(first);
          expect((await page.request.get(first)).status()).toBe(404);
        }
        first = current;
        const following = page.locator(
          '[data-offer="restructuration-de-restaurants"]',
        );
        await offer.scrollIntoViewIfNeeded();
        const before = await following.boundingBox();
        await offer.hover();
        await expect(preview).toBeVisible();
        expect(await following.boundingBox()).toEqual(before);
        expect(
          await offer
            .locator('dt')
            .evaluate((node) => getComputedStyle(node).zIndex),
        ).toBe('2');
        expect(
          await preview.evaluate((node) => getComputedStyle(node).zIndex),
        ).toBe('1');
        await page.mouse.move(0, 0);
        await expect(preview).toBeHidden();
        await offer.focus();
        await expect(preview).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(preview).toBeHidden();
      }
      const mobile = await browser.newContext({
        javaScriptEnabled,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 375, height: 812 },
      });
      try {
        const mobilePage = await mobile.newPage();
        await mobilePage.goto('/');
        await expect(mobilePage.locator('.vitrine-offer-hover')).toBeVisible();
        expect(
          await mobilePage.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      } finally {
        await mobile.close();
      }
      await page.locator('.vitrine-services').scrollIntoViewIfNeeded();
      await page.locator('[data-offer="creation-de-marque"]').hover();
      await expect(page.locator('.vitrine-offer-hover')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('offre-survol.png') });
      await page.goto(edit);
      await form.getByLabel('Retirer le visuel de survol').check();
      await form.getByRole('button', { name: 'Enregistrer le survol' }).click();
      await expect(page).toHaveURL('/connect');
      expect((await page.request.get(first!)).status()).toBe(404);
      await page.goto('/');
      await expect(page.locator('.vitrine-offer-hover')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}
