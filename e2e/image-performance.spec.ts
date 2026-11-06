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
      page.on('response', (response) => {
        const url = new URL(response.url());
        if (
          response.request().resourceType() === 'image' &&
          (url.pathname.startsWith('/images/') ||
            (response.headers()['content-type']?.startsWith('image/') &&
              !response.headers()['content-type']?.includes('svg') &&
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
      expect(heroUrl).toMatch(
        /\/api\/v1\/vitrine-images\/[a-f0-9-]+\?w=(320|640|1280|1920)&v=1$/,
      );
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
      const sources = await page
        .locator('.vitrine img')
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute('src')),
        );
      expect(sources.every((source) => source?.startsWith('/api/v1/'))).toBe(
        true,
      );
      await page.goto('/clients/viandes-des-sommets');
      expect(
        await page
          .locator('.client-project img')
          .evaluateAll((elements) =>
            elements.every((element) =>
              element
                .getAttribute('src')
                ?.startsWith('/api/v1/vitrine-images/'),
            ),
          ),
      ).toBe(true);
      await page.goto('/');
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
