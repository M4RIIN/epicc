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
  const script = await page.request.get((await scripts.getAttribute('src'))!);
  expect((await script.body()).byteLength).toBeLessThan(2048);
  await page.goto('/clients/viandes-des-sommets/');
  await expect(page.locator('script[src]')).toHaveCount(0);
});
