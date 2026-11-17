import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [false, true]) {
  test(`clients sur une ligne avec deux photos maximum, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('.vitrine-project')).toHaveCount(12);
      const viande = page.getByRole('figure', {
        name: 'Viandes des Sommets',
        exact: true,
      });
      await expect(viande.locator('.vitrine-project-photo')).toHaveCount(2);
      await expect(
        viande.locator('.vitrine-project-photo').first(),
      ).toHaveAttribute('data-file', 'Rectangle6.png');
      for (const width of [1920, 1440, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const rows = await page
          .locator('.vitrine-project')
          .evaluateAll((projects) =>
            projects.map((project) => {
              const title = project
                .querySelector('.vitrine-project-names')!
                .getBoundingClientRect();
              const photos = Array.from(
                project.querySelector('.vitrine-project-photos')!.children,
              ).map((photo) => {
                const rect = photo.getBoundingClientRect();
                return {
                  x: rect.x,
                  right: rect.right,
                  y: rect.y,
                  bottom: rect.bottom,
                };
              });
              return {
                title: { right: title.right, y: title.y, bottom: title.bottom },
                photos,
              };
            }),
          );
        for (const { title, photos } of rows) {
          expect(photos.length).toBeLessThanOrEqual(2);
          expect(photos[0]!.x).toBeGreaterThan(title.right);
          expect(
            Math.abs(
              (title.y + title.bottom) / 2 -
                (photos[0]!.y + photos[0]!.bottom) / 2,
            ),
          ).toBeLessThan(1);
          if (photos[1]) {
            expect(photos[1].x).toBeGreaterThan(photos[0]!.right);
            expect(
              Math.abs(
                (photos[1].y + photos[1].bottom) / 2 -
                  (photos[0]!.y + photos[0]!.bottom) / 2,
              ),
            ).toBeLessThan(1);
          }
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (javaScriptEnabled && [1440, 375].includes(width))
          await page
            .locator('#projets')
            .screenshot({ path: testInfo.outputPath(`projets-${width}.png`) });
      }
    } finally {
      await context.close();
    }
  });
}
