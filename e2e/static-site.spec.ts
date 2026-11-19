import { readFile, readdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('le build ne publie que les pages et fichiers de la vitrine', async ({
  request,
}) => {
  expect((await readdir('dist/site')).sort()).toEqual([
    '404.html',
    'assets',
    'clients',
    'fonts',
    'index.html',
    'robots.txt',
    'sitemap.xml',
  ]);
  for (const route of [
    '/',
    '/clients/amafolia/',
    '/clients/viandes-des-sommets/',
  ]) {
    const response = await request.get(route);
    expect(response.ok()).toBe(true);
    const file =
      route === '/'
        ? 'dist/site/index.html'
        : 'dist/site' + route + 'index.html';
    expect(await response.text()).toEqual(await readFile(file, 'utf8'));
  }
  for (const route of [
    '/connect',
    '/api/health',
    '/api/v1/project-images',
    '/ancienne-page',
  ]) {
    expect((await request.get(route)).status()).toBe(404);
  }
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain(
    'Sitemap: http://127.0.0.1:3190/sitemap.xml',
  );
});

test('le mobile charge une image WebP adaptée et aucun code React', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const hero = page.locator('.vitrine-cover > img').first();
  await expect(hero).toHaveAttribute('fetchpriority', 'high');
  await expect(hero).toHaveAttribute('srcset', /320w.*640w/);
  const current = await hero.evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    return img.currentSrc;
  });
  expect(current).toMatch(/-640-[a-f0-9]+\.webp$/);
  const response = await page.request.get(current);
  expect(response.headers()['content-type']).toBe('image/webp');
  expect(response.headers()['cache-control']).toContain('immutable');
  expect((await response.body()).byteLength).toBeLessThan(200_000);
  const font = await page.request.get('/fonts/roboto-mono.woff2');
  expect(font.headers()['content-type']).toBe('font/woff2');
  expect((await font.body()).byteLength).toBeLessThan(120_000);
  const scripts = page.locator('script[src]');
  await expect(scripts).toHaveCount(1);
  const scriptPath = (await scripts.getAttribute('src'))!;
  const script = await page.request.get(scriptPath);
  expect((await script.body()).byteLength).toBeLessThan(2048);
  await page.goto('/clients/viandes-des-sommets/');
  await expect(scripts).toHaveAttribute('src', scriptPath);
});

test('le logo accompagne le pointeur sur l’accueil et sur les fiches', async ({
  page,
}) => {
  for (const path of [
    '/',
    '/clients/amafolia/',
    '/clients/viandes-des-sommets/',
  ]) {
    await page.goto(path);
    const logo = page.locator('.epicc-pointer-logo');
    await expect(logo).toBeHidden();
    await page.mouse.move(100, 100);
    await expect(logo).toBeVisible();
    await expect(logo).toHaveCSS('pointer-events', 'none');
    await expect(logo).toHaveCSS('translate', '12px 12px');
    expect(await logo.boundingBox()).toMatchObject({ x: 112, y: 112 });
    await logo.evaluate((image) => (image as HTMLImageElement).decode());

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width - 1, height - 1);
    await expect(logo).toHaveAttribute('data-flip-x', '');
    await expect(logo).toHaveAttribute('data-flip-y', '');
    expect(await logo.boundingBox()).toMatchObject({
      x: width - 53,
      y: height - 47,
    });
    await page.mouse.move(-1, -1);
    await expect(logo).toBeHidden();
  }
});

test('le logo reste masqué lors d’une interaction tactile', async ({
  browser,
}) => {
  const page = await browser.newPage({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 812 },
  });
  try {
    await page.goto('/');
    await page.touchscreen.tap(100, 100);
    await expect(page.locator('.epicc-pointer-logo')).toBeHidden();
  } finally {
    await page.close();
  }
});
