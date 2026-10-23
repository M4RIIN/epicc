import { expect, test } from '@playwright/test';

test('la vitrine et ses métadonnées sont présentes sans JavaScript', async ({
  browser,
  request,
}) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<h1');
  expect(html).toContain(
    'Des idées ambitieuses. Des projets qui prennent vie.',
  );
  expect(html).toContain('Nous croyons aux projets qui ont du sens.');
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Les belles histoiress’écrivent à plusieurs.',
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /EPICC accompagne/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://127.0.0.1:3190/',
    );
  } finally {
    await context.close();
  }
});

test('la navigation fonctionne après hydratation, avec les assets de production', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCSS('font-weight', '400');
  await page.getByRole('link', { name: /Espace de gestion/ }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Connexion à la gestion',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  );
  await page.getByRole('link', { name: /Retour à la vitrine/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Les belles histoires',
  );
  expect(errors).toEqual([]);
});

test('API, backoffice et SEO partagent la même origine', async ({
  request,
}) => {
  expect((await request.get('/api/health')).status()).toBe(200);
  for (const asset of [
    'images/botanique.jpg',
    'images/atelier.jpg',
    'images/cafe.jpg',
    'images/grain.svg',
    'fonts/caveat.ttf',
  ]) {
    const response = await request.get(`/${asset}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).not.toContain('text/html');
  }
  expect((await request.get('/api/v1/pages/accueil')).status()).toBe(200);
  expect(
    (await request.get('/api/inconnue')).headers()['content-type'],
  ).toContain('application/json');
  expect((await request.get('/api/inconnue')).status()).toBe(404);
  expect((await request.get('/page-inconnue')).status()).toBe(404);
  const connect = await request.get('/connect');
  expect(connect.headers()['x-robots-tag']).toBe('noindex, nofollow');
  expect(connect.headers()['cache-control']).toBe('no-store');
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Disallow: /connect',
  );
  expect(await (await request.get('/sitemap.xml')).text()).toContain(
    '<loc>http://127.0.0.1:3190/</loc>',
  );
});

test('la vitrine reste lisible sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('le répertoire et les fiches fonctionnent sans JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(
      6,
    );
    await page.getByLabel('Nom, ville ou univers').fill('lyon');
    await page.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(
      1,
    );
    await page.getByRole('link', { name: 'Découvrir Maison Sauge' }).click();
    await expect(page).toHaveURL(/clients\/maison-sauge$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Maison Sauge',
    );
    await expect(
      page.getByText('Une identité qui respire, simple et vivante.', {
        exact: false,
      }),
    ).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://127.0.0.1:3190/clients/maison-sauge',
    );
    await page.getByRole('link', { name: 'Atelier Forme →' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Atelier Forme',
    );
    await page.getByRole('link', { name: 'Retour au répertoire' }).click();
    await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(
      6,
    );
  } finally {
    await context.close();
  }
});

test('les filtres se combinent et une recherche vide peut être réinitialisée', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByLabel('Univers', { exact: true })
    .selectOption('Art de vivre');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(2);
  await page.getByLabel('Nom, ville ou univers').fill('café introuvable');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.getByText('Aucune fiche pour le moment.')).toBeVisible();
  await page
    .getByRole('link', { name: 'Retrouver toutes les rencontres' })
    .click();
  await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(6);
  await page.goto('/?q=creation');
  await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(2);
});

test('toutes les fiches existent, les inconnues répondent 404', async ({
  request,
}) => {
  for (const slug of [
    'maison-sauge',
    'atelier-forme',
    'les-jours-heureux',
    'studio-sillage',
    'jardin-commun',
    'la-pause',
  ]) {
    expect((await request.get(`/clients/${slug}`)).status()).toBe(200);
  }
  expect((await request.get('/clients/inconnu')).status()).toBe(404);
});

test('les fiches restent lisibles sur les petits écrans', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 812 });
    for (const path of ['/', '/clients/les-jours-heureux']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test('les liens et les contrôles sont accessibles au clavier', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Aller au contenu' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByLabel('Nom, ville ou univers').focus();
  await page.keyboard.type('Maison');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(1);
  await page.getByRole('link', { name: 'Découvrir Maison Sauge' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Maison Sauge',
  );
});
