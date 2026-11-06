import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [false, true]) {
  test(`projet Viandes des Sommets accessible et référencé, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      const response = await page.goto('/clients/viandes-des-sommets');
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
      });
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(
        'Viandes des Sommets — Identité visuelle & logo | EPICC',
      );
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'http://127.0.0.1:3190/clients/viandes-des-sommets',
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /construction du logo/,
      );
      const graph = await page
        .locator('script[type="application/ld+json"]')
        .textContent();
      const structured = JSON.parse(graph!);
      expect(
        structured['@graph'].map((item: { '@type': string }) => item['@type']),
      ).toEqual(['WebPage', 'CreativeWork', 'BreadcrumbList']);
      const images = page.locator('.client-project img');
      await expect(images).toHaveCount(15);
      for (const width of [1920, 1440, 375, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const img of await images.all()) {
          await img.scrollIntoViewIfNeeded();
          await expect
            .poll(() =>
              img.evaluate(
                (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
              ),
            )
            .toBe(true);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const hero = await page.locator('.project-hero').boundingBox();
        expect(hero!.y).toBeLessThanOrEqual(0);
        expect(hero!.height / hero!.width).toBeCloseTo(1031 / 1920, 2);
        expect(hero!.width).toBe(width);
        if (javaScriptEnabled && [1920, 375].includes(width)) {
          await images.evaluateAll(async (elements) => {
            await Promise.all(
              elements.map((element) => (element as HTMLImageElement).decode()),
            );
          });
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: testInfo.outputPath(`client-${width}.png`),
            fullPage: true,
          });
        }
      }
      await page.getByRole('link', { name: 'Tous les projets' }).click();
      await expect(page).toHaveURL('/#projets');
      await page
        .getByRole('link', {
          name: 'Viandes des Sommets — découvrir l’identité visuelle',
        })
        .first()
        .click();
      await expect(page).toHaveURL('/clients/viandes-des-sommets');
      const sitemap = await page.request.get('/sitemap.xml');
      expect(await sitemap.text()).toContain(
        '<loc>http://127.0.0.1:3190/clients/viandes-des-sommets</loc>',
      );
    } finally {
      await context.close();
    }
  });
}
