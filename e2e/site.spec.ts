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
      'Des idées ambitieuses. Des projets qui prennent vie.',
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
  await expect(page.locator('h1')).toHaveCSS('font-weight', '500');
  await page.getByRole('link', { name: /Espace de gestion/ }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Les coulisses',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  );
  await page.getByRole('link', { name: /Retour à la vitrine/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Des idées ambitieuses',
  );
  expect(errors).toEqual([]);
});

test('API, backoffice et SEO partagent la même origine', async ({
  request,
}) => {
  expect((await request.get('/api/health')).status()).toBe(200);
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
