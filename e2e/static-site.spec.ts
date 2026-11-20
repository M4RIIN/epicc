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
  expect((await script.body()).byteLength).toBeLessThan(3.5 * 1024);
  await page.goto('/clients/viandes-des-sommets/');
  await expect(scripts).toHaveAttribute('src', scriptPath);
});

test('les paragraphes se révèlent une fois en entrant à l’écran', async ({
  page,
}) => {
  for (const { path, selector } of [
    { path: '/', selector: '.vitrine-biography-question' },
    {
      path: '/clients/viandes-des-sommets/',
      selector: '.vds-construction p',
    },
  ]) {
    await page.goto(path);
    const paragraph = page.locator(selector);
    const markup = await paragraph.innerHTML();
    const textLength = (await paragraph.textContent())!.length;
    const remaining = () =>
      paragraph.evaluate((element) => {
        const hidden = CSS.highlights.get('paragraph-reveal');
        const range = Array.from(hidden ?? []).find(
          ({ endContainer }) => endContainer === element,
        );
        return range?.toString().length ?? 0;
      });

    await expect(paragraph).not.toBeInViewport();
    await expect.poll(remaining).toBe(textLength);
    await paragraph.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => {
        const length = await remaining();
        return length > 0 && length < textLength;
      })
      .toBe(true);
    await expect.poll(remaining).toBe(0);
    expect(await paragraph.innerHTML()).toBe(markup);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(paragraph).not.toBeInViewport();
    await paragraph.scrollIntoViewIfNeeded();
    expect(await remaining()).toBe(0);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/clients/amafolia/');
  await expect(page.locator('.amafolia-presentation')).toContainText(
    'un restaurant italien',
  );
  expect(
    await page.evaluate(() => CSS.highlights.has('paragraph-reveal')),
  ).toBe(false);
});

test('les textes de la biographie se révèlent dans l’ordre', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const paragraphs = page.locator('.vitrine-biography-story p');
  const lengths = await paragraphs.evaluateAll((elements) =>
    elements.map((element) => element.textContent!.length),
  );
  const remaining = () =>
    paragraphs.evaluateAll((elements) => {
      const hidden = Array.from(CSS.highlights.get('paragraph-reveal') ?? []);
      return elements.map(
        (element) =>
          hidden.find((range) => range.endContainer === element)?.toString()
            .length ?? 0,
      );
    });

  await expect.poll(remaining).toEqual(lengths);
  await paragraphs.first().scrollIntoViewIfNeeded();
  await expect(paragraphs.nth(1)).toBeInViewport();
  await expect
    .poll(
      async () => {
        const hiddenLengths = await remaining();
        const current = hiddenLengths.findIndex((length) => length > 0);
        if (current === -1) return true;
        expect(hiddenLengths.slice(current + 1)).toEqual(
          lengths.slice(current + 1),
        );
        return false;
      },
      { timeout: 15_000, intervals: [100] },
    )
    .toBe(true);

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect.poll(remaining).toEqual(lengths);
  await paragraphs.last().scrollIntoViewIfNeeded();
  await expect(paragraphs.first()).not.toBeInViewport();
  await expect
    .poll(async () => {
      const hiddenLengths = await remaining();
      expect(hiddenLengths.slice(1)).toEqual(lengths.slice(1));
      return hiddenLengths[0]! < lengths[0]!;
    })
    .toBe(true);
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
    const icon = page.locator('link[rel="icon"]');
    const imagePath = (await logo.getAttribute('src'))!;
    await expect(icon).toHaveAttribute('href', imagePath);
    await expect(icon).toHaveAttribute('sizes', '64x64');
    const response = await page.request.get(imagePath);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('image/png');
    await page.mouse.move(100, 100);
    await expect(logo).toBeVisible();
    await expect(logo).toHaveCSS('pointer-events', 'none');
    await expect(logo).toHaveCSS('border-width', '0px');
    await expect(logo).toHaveCSS('box-shadow', 'none');
    await expect(logo).toHaveCSS('translate', '12px 12px');
    expect(await logo.boundingBox()).toMatchObject({ x: 112, y: 112 });
    await logo.evaluate((image) => (image as HTMLImageElement).decode());

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width - 1, height - 1);
    await expect(logo).toHaveAttribute('data-flip-x', '');
    await expect(logo).toHaveAttribute('data-flip-y', '');
    expect(await logo.boundingBox()).toMatchObject({
      x: width - 53,
      y: height - 53,
    });
    await page.mouse.move(-1, -1);
    await expect(logo).toBeHidden();
  }
});

test('le logo distingue la souris du tactile sur un appareil hybride', async ({
  browser,
}) => {
  const page = await browser.newPage({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 812 },
  });
  try {
    await page.goto('/');
    const logo = page.locator('.epicc-pointer-logo');
    await page.mouse.move(100, 100);
    await expect(logo).toBeVisible();
    await page.touchscreen.tap(100, 100);
    await expect(logo).toBeHidden();
  } finally {
    await page.close();
  }
});
