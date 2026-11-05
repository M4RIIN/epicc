import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [false, true]) {
  test(`projets en deux colonnes, titres alignés et photos groupées, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }, testInfo) => {
    test.setTimeout(60000);
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('.vitrine-loading')).toBeHidden({
        timeout: 15000,
      });
      const viande = page.getByRole('figure', {
        name: 'Viande des Sorgues',
        exact: true,
      });
      const anna = page.getByRole('figure', { name: 'Annafurna', exact: true });
      await expect(viande.locator('.vitrine-project-photo')).toHaveCount(4);
      await expect(anna.locator('.vitrine-project-photo')).toHaveCount(2);
      await expect(
        viande.locator('.vitrine-project-photo').nth(1),
      ).toHaveAttribute('data-file', 'Rectangle4.png');
      await expect(
        viande.locator('.vitrine-project-photo').nth(2),
      ).toHaveAttribute('data-file', 'Dsc19081.jpg');
      await expect(
        viande.locator('.vitrine-project-photo').nth(3),
      ).toHaveAttribute('data-file', 'Dsc067761.jpg');
      for (const width of [1920, 1440, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const columns = page.locator('.vitrine-project-column');
        const left = (await columns.nth(0).boundingBox())!;
        const right = (await columns.nth(1).boundingBox())!;
        if (width > 700) {
          expect(Math.abs(left.y - right.y)).toBeLessThan(1);
          expect(left.x + left.width).toBeLessThan(right.x);
        } else {
          expect(right.y).toBeGreaterThan(left.y + left.height);
        }
        const groups = await page
          .locator('.vitrine-project')
          .evaluateAll((projects) =>
            projects.map((project) => {
              const title = project
                .querySelector('.vitrine-project-name')!
                .getBoundingClientRect();
              const photos = Array.from(
                project.querySelectorAll('.vitrine-project-photo'),
              ).map((photo) => {
                const rect = photo.getBoundingClientRect();
                return {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                };
              });
              return {
                title: { x: title.x, y: title.y, width: title.width },
                photos,
                side: project.closest('[data-side]')!.getAttribute('data-side'),
              };
            }),
          );
        for (const { title, photos, side } of groups) {
          if (!photos.length) continue;
          const first = photos[0]!;
          expect(Math.abs(title.y - first.y)).toBeLessThan(1);
          for (const [index, photo] of photos.entries()) {
            if (side === 'left') {
              expect(photo.x).toBeGreaterThanOrEqual(title.x + title.width);
              expect(
                Math.abs(photo.x + photo.width - first.x - first.width),
              ).toBeLessThan(1);
            } else {
              expect(photo.x + photo.width).toBeLessThanOrEqual(title.x);
              expect(Math.abs(photo.x - first.x)).toBeLessThan(1);
            }
            if (index)
              expect(photo.y).toBeGreaterThan(
                photos[index - 1]!.y + photos[index - 1]!.height,
              );
          }
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const sizes = await viande
          .locator('.vitrine-project-photo')
          .evaluateAll((photos) =>
            photos.map((photo) =>
              Math.round(photo.getBoundingClientRect().width),
            ),
          );
        expect(new Set(sizes).size).toBeGreaterThan(1);
        if (javaScriptEnabled && [1440, 375].includes(width)) {
          await page
            .locator('#projets')
            .screenshot({ path: testInfo.outputPath(`projets-${width}.png`) });
        }
      }
    } finally {
      await context.close();
    }
  });
}
