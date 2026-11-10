import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [false, true]) {
  test(`le remplacement du visuel du backoffice est publié dans le projet, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({ javaScriptEnabled });
    const page = await context.newPage();
    const image = page.locator('[data-file="Dsc067761.jpg"] img');
    let edited = false;
    try {
      await page.goto('/');
      await expect(image).toHaveAttribute(
        'src',
        /^\/api\/v1\/project-images\//,
      );
      const initial = await image.getAttribute('src');
      await page.goto('/connect');
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(
        page.getByRole('heading', { name: 'Gérer les clients', exact: true }),
      ).toBeVisible();
      await page.goto('/connect/projets/Dsc067761.jpg');
      await page
        .getByLabel('Texte alternatif de l’image')
        .fill('Visuel de projet de test');
      await page.getByLabel('Remplacer par une image').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
          'base64',
        ),
      });
      await page.getByRole('button', { name: 'Enregistrer l’image' }).click();
      await expect(page).toHaveURL('/connect#project-images');
      edited = true;
      await page.goto('/');
      await expect(image).toHaveAttribute('alt', 'Visuel de projet de test');
      const current = await image.getAttribute('src');
      expect(current).not.toBe(initial);
      await expect(image).toHaveAttribute('srcset', /\?w=320&v=1 2w/);
      expect((await page.request.get(current!)).headers()['content-type']).toBe(
        'image/png',
      );
    } finally {
      if (edited) {
        await page.goto('/connect/projets/Dsc067761.jpg');
        await page.getByRole('button', { name: 'Rétablir l’original' }).click();
        await expect(page).toHaveURL('/connect#project-images');
      }
      await context.close();
    }
  });
}
