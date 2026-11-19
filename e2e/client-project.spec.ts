import { expect, test } from '@playwright/test';

test.describe('fiche Amafolia', () => {
  test.use({ javaScriptEnabled: false });

  test('le premier projet ouvre une fiche navigable sur mobile', async ({
    page,
  }) => {
    const route = '/clients/amafolia/';
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('radio', { name: 'Amafolia' })).toBeChecked();
    const link = page.getByRole('link', {
      name: 'Voir la fiche — Amafolia',
    });
    await link.click();
    await expect(page).toHaveURL(route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Amafolia',
    );

    const images = page.locator('.amafolia img');
    expect(await images.count()).toBeGreaterThan(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
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
    await page.setViewportSize({ width: 1024, height: 900 });
    const logo = (await page.locator('.amafolia-logo').boundingBox())!;
    const interventions = (await page
      .locator('.amafolia-interventions')
      .boundingBox())!;
    expect(logo.y + logo.height).toBeLessThan(interventions.y);

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href');
    expect(new URL(canonical!).pathname).toBe(route);
    const sitemap = await page.request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain(`<loc>${canonical}</loc>`);
    await page.getByRole('link', { name: 'Tous les projets' }).click();
    await expect(page).toHaveURL('/#projets');
  });
});

for (const javaScriptEnabled of [false, true]) {
  test(`projet Viandes des Sommets accessible et référencé, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      javaScriptEnabled,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const response = await page.goto('/clients/viandes-des-sommets/');
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
      });
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(
        'Viandes des Sommets — Identité visuelle & logo | EPICC',
      );
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Viandes des Sommets',
      );
      await expect(page.getByRole('list', { name: 'Missions' })).toContainText(
        'Lancement d’une nouvelle marque',
      );
      await expect(
        page.getByRole('region', { name: 'Construction du logo' }),
      ).toContainText('regroupement d’éleveurs des Pyrénées');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'http://127.0.0.1:3190/clients/viandes-des-sommets/',
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
      const menu = page.getByRole('navigation', {
        name: 'Navigation principale',
      });
      await expect(
        menu.getByRole('link', { name: 'Menu — accueil EPICC' }),
      ).toHaveAttribute('href', '/');
      await expect(
        menu.getByRole('link', { name: 'À propos' }),
      ).toHaveAttribute('href', '/#a-propos');
      await expect(
        menu.getByRole('link', { name: 'Les expertises' }),
      ).toHaveAttribute('href', '/#prestations');
      const images = page.locator('.client-project img:not([aria-hidden] img)');
      await expect(images).toHaveCount(19);
      const cover = page.getByRole('img', {
        name: /pièce de viande suspendue/i,
      });
      for (const width of [1920, 1440, 1024, 375, 320]) {
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
        const coverBox = (await cover.boundingBox())!;
        expect(coverBox.width / coverBox.height).toBeCloseTo(1364 / 791, 2);
        expect(coverBox.x).toBeGreaterThan(0);
        expect(coverBox.x + coverBox.width).toBeLessThan(width);
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
      await menu.getByRole('link', { name: 'Les projets clients' }).click();
      await expect(page).toHaveURL('/#projets');
      await page
        .locator('.vitrine-project-index label')
        .filter({ hasText: 'Viandes des Sommets' })
        .click();
      await page
        .getByRole('link', { name: 'Voir la fiche — Viandes des Sommets' })
        .click();
      await expect(page).toHaveURL('/clients/viandes-des-sommets/');
      const sitemap = await page.request.get('/sitemap.xml');
      expect(await sitemap.text()).toContain(
        '<loc>http://127.0.0.1:3190/clients/viandes-des-sommets/</loc>',
      );
    } finally {
      await context.close();
    }
  });
}

test('le reportage défile en boucle dans les deux sens sans commande de pause', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('/clients/viandes-des-sommets/');
  await expect(page.locator('.vds-gallery').getByRole('checkbox')).toHaveCount(
    0,
  );
  const tracks = page.locator('.vds-photo-track');
  await expect(tracks).toHaveCount(2);
  for (const track of await tracks.all()) {
    await expect(track).toHaveCSS('animation-play-state', 'running');
  }

  const positions = await tracks.evaluateAll((elements) =>
    elements.map((element) => {
      const [animation] = element.getAnimations();
      if (!animation) throw new Error('Animation du reportage introuvable');
      animation.pause();
      const positionAt = (time: number) => {
        animation.currentTime = time;
        return element.getBoundingClientRect().x;
      };
      return {
        start: positionAt(0),
        later: positionAt(1000),
        loop: positionAt(30000),
      };
    }),
  );
  const top = positions[0]!;
  const bottom = positions[1]!;
  expect(top.later).toBeLessThan(top.start);
  expect(bottom.later).toBeGreaterThan(bottom.start);
  expect(top.loop).toBeCloseTo(top.start);
  expect(bottom.loop).toBeCloseTo(bottom.start);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const track of await tracks.all()) {
    await expect(track).toHaveCSS('animation-name', 'none');
    await expect(track.getByRole('img')).toHaveCount(4);
    const lastPhoto = track.getByRole('img').last();
    const photoBox = (await lastPhoto.boundingBox())!;
    expect(photoBox.x + photoBox.width).toBeLessThanOrEqual(1920);
  }
});
