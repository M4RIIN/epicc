import { expect, test } from '@playwright/test';
import sharp from 'sharp';

for (const javaScriptEnabled of [false, true]) {
  test(`les navigateurs chargent les WebP adaptés sans télécharger les originaux, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      javaScriptEnabled,
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
    });
    try {
      const page = await context.newPage();
      const originalRequests: string[] = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (
          request.resourceType() === 'image' &&
          (/^\/images\/vitrine\/.*\.(png|jpe?g)$/.test(url.pathname) ||
            (/^\/api\/v1\/(?:project|offer)-images\/[a-f0-9-]+$/.test(
              url.pathname,
            ) &&
              !url.search))
        )
          originalRequests.push(url.pathname);
      });
      await page.goto('/');
      const hero = page.locator('.vitrine-cover img');
      await expect(hero).toHaveAttribute('loading', 'eager');
      await expect(hero).toHaveAttribute('fetchpriority', 'high');
      await expect(hero).toHaveAttribute('srcset', /320w/);
      await expect
        .poll(() =>
          hero.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const heroUrl = await hero.evaluate(
        (element: HTMLImageElement) => element.currentSrc,
      );
      expect(heroUrl).toContain('/images/optimized/v1/');
      const heroResponse = await page.request.get(heroUrl);
      expect(heroResponse.headers()['cache-control']).toContain('immutable');
      expect((await heroResponse.body()).length).toBeLessThan(400_000);
      const blue = page.locator('[data-file="Dsc10951.jpg"] img');
      await blue.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          blue.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const selected = await blue.evaluate(
        (element: HTMLImageElement) => element.currentSrc,
      );
      expect(selected).toMatch(/\?w=(320|640)&v=1$/);
      const photo = await page.request.get(selected);
      expect(photo.headers()['content-type']).toContain('image/webp');
      expect(photo.headers()['cache-control']).toContain('immutable');
      const bytes = await photo.body();
      expect(bytes.length).toBeLessThan(250_000);
      expect((await sharp(bytes).metadata()).format).toBe('webp');
      expect(originalRequests).toEqual([]);
      const html = await (await page.request.get('/')).text();
      expect(html).toContain('srcSet=');
      expect(html).toContain('rel="canonical"');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'EPICC — Chloé Catala',
      );
      await expect(blue).toHaveAttribute(
        'alt',
        'Texture bleue, détail du projet Casamatta.',
      );
    } finally {
      await context.close();
    }
  });
}
