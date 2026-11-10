import { expect, test } from '@playwright/test';

test('la vitrine et ses métadonnées sont présentes sans JavaScript', async ({
  browser,
  request,
}) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<h1');
  expect(html).toContain('Salut, moi c’est');
  expect(html).toContain('Né pour accompagner les acteurs de la restauration');
  expect(html).not.toContain('data-home-loading');
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'EPICC — Chloé Catala, communication et identité visuelle à Toulouse',
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Chloé Catala, EPICC/,
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
  await expect(page.locator('#biography-title')).toHaveCSS(
    'font-family',
    /Roboto Mono/,
  );
  await page.getByText('Menu', { exact: true }).first().click();
  await page.getByRole('link', { name: /Espace de gestion/ }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Connexion à la gestion',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  );
  await page.getByRole('link', { name: /Retour à la vitrine/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'EPICC — Chloé Catala',
  );
  expect(errors).toEqual([]);
});

test('API, backoffice et SEO partagent la même origine', async ({
  request,
}) => {
  expect((await request.get('/api/health')).status()).toBe(200);
  for (const asset of [
    'images/botanique.jpg',
    'images/atelier.jpg',
    'images/cafe.jpg',
    'images/grain.svg',
    'fonts/caveat.ttf',
  ]) {
    const response = await request.get(`/${asset}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).not.toContain('text/html');
  }
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

test('les anciennes fiches et leur gestion sont retirées, seule la page Sommets reste publiée', async ({
  request,
}) => {
  for (const path of [
    '/clients',
    '/clients?q=lyon',
    '/connect/clients/nouveau',
    '/connect/clients/maison-sauge',
    ...[
      'maison-sauge',
      'atelier-forme',
      'les-jours-heureux',
      'studio-sillage',
      'jardin-commun',
      'la-pause',
      'inconnu',
    ].map((slug) => `/clients/${slug}`),
    '/api/v1/clients',
    '/api/v1/admin/clients',
    '/api/v1/client-images/00000000-0000-4000-8000-000000000001',
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  expect(
    (
      await request.post('/api/v1/admin/clients/maison-sauge', { data: '' })
    ).status(),
  ).toBe(404);
  expect((await request.get('/clients/viandes-des-sommets')).status()).toBe(
    200,
  );
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(2);
  expect(sitemap).toContain('/clients/viandes-des-sommets</loc>');
  const html = await (await request.get('/')).text();
  expect(html).not.toContain('Les rencontres');
});

test('les pages conservées restent lisibles sur les petits écrans', async ({
  page,
}) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 812 });
    for (const path of ['/', '/clients/viandes-des-sommets']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test('le menu et les sections de la maquette fonctionnent sans JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByText('Menu', { exact: true }).first().click();
    await page
      .getByRole('link', { name: 'À propos de Chloé', exact: true })
      .click();
    await expect(page).toHaveURL(/#a-propos$/);
    await expect(
      page.getByRole('heading', { name: /Salut, moi c’est/ }),
    ).toBeInViewport();
    await page.goto('/');
    await page.getByText('Menu', { exact: true }).first().click();
    await expect(
      page.getByRole('link', { name: 'Les rencontres', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: /Espace de gestion/ }).click();
    await expect(page).toHaveURL(/\/connect$/);
  } finally {
    await context.close();
  }
});

test('les visuels de la vitrine sont servis par le backend et la typographie reste disponible', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async () => {
    for (const image of Array.from(document.images)) image.loading = 'eager';
    await document.fonts.ready;
  });
  await page.waitForFunction(() =>
    Array.from(document.images).every((image) => image.complete),
  );
  const images = await page.locator('.vitrine img').evaluateAll((images) =>
    images.map((node) => {
      const image = node as HTMLImageElement;
      const bounds = image.getBoundingClientRect();
      return {
        src: image.getAttribute('src')!,
        loaded: image.naturalWidth > 0,
        visible: bounds.width > 0 && bounds.height > 0,
      };
    }),
  );
  expect(images.length).toBeGreaterThan(0);
  for (const image of images) {
    expect(image.src).toMatch(/^\/api\/v1\/(?:vitrine|project|offer)-images\//);
    expect(image.loaded).toBe(true);
    expect(image.visible).toBe(true);
  }
  const vectors = await page
    .locator('.vitrine svg image')
    .evaluateAll((images) =>
      images.map((image) => image.getAttribute('href')!),
    );
  expect(vectors.every((src) => src.startsWith('/api/v1/'))).toBe(true);
  for (const src of new Set([
    ...vectors,
    '/fonts/roboto-mono.ttf',
    '/fonts/roboto-mono-italic.ttf',
  ])) {
    const response = await request.get(src);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).not.toContain('text/html');
    expect((await response.body()).length).toBeGreaterThan(0);
  }
  expect(
    await page.evaluate(() => document.fonts.check('700 20px "Roboto Mono"')),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('la connexion reste accessible depuis le menu sans JavaScript et les visuels utilisent leurs originaux', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('main.vitrine')).toBeVisible();
    await page.getByText('Menu', { exact: true }).click();
    const connection = page.getByRole('link', {
      name: 'Espace de gestion',
      exact: false,
    });
    for (const width of [1440, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(connection).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await expect(page.locator('.vitrine-cover img')).toHaveAttribute(
      'src',
      /^\/api\/v1\/vitrine-images\/[a-f0-9-]+$/,
    );
    expect(
      (await request.get('/images/vitrine/Image29102026A17281.png')).headers()[
        'content-type'
      ],
    ).toContain('image/png');
    await connection.click();
    await expect(page).toHaveURL(/\/connect$/);
    await expect(page.getByLabel('Adresse e-mail')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Se connecter' }),
    ).toBeEnabled();
  } finally {
    await context.close();
  }
});

test('les images lentes ne masquent pas la vitrine et ne bloquent pas la navigation', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const media = await (await page.request.get('/api/v1/vitrine-images')).json();
  const stampUrl = media.find(
    (item: { file: string }) => item.file === 'Group16.svg',
  ).image;
  await page.route(`**${stampUrl}`, async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main.vitrine')).toBeVisible();
    await expect(page.locator('.vitrine-cover img')).toHaveAttribute(
      'loading',
      'eager',
    );
    await expect(page.locator('.vitrine-cover img')).toHaveAttribute(
      'fetchpriority',
      'high',
    );
    await expect(
      page.locator('.vitrine-childhood > img:not(.vitrine-childhood-caption)'),
    ).toHaveAttribute('loading', 'lazy');
    await page.getByText('Menu', { exact: true }).click();
    await expect(
      page.getByRole('link', { name: 'À propos de Chloé', exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});

test('une image en erreur ne bloque pas le contenu', async ({ page }) => {
  const media = await (await page.request.get('/api/v1/vitrine-images')).json();
  const stampUrl = media.find(
    (item: { file: string }) => item.file === 'Group16.svg',
  ).image;
  await page.route(`**${stampUrl}`, (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('main.vitrine')).toBeVisible();
});

test('les données structurées décrivent Chloé Catala et les prestations publiées', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const structured = JSON.parse(
      await page.locator('script[type="application/ld+json"]').innerText(),
    );
    const person = structured['@graph'].find(
      (item: { '@type': string }) => item['@type'] === 'Person',
    );
    const organization = structured['@graph'].find(
      (item: { '@type': string }) => item['@type'] === 'Organization',
    );
    expect(person.name).toBe('Chloé Catala');
    expect(organization.areaServed.name).toContain('Toulouse');
    const offers = await (await request.get('/api/v1/offers')).json();
    expect(
      organization.hasOfferCatalog.itemListElement.map(
        (item: { itemOffered: { name: string; description: string } }) => ({
          name: item.itemOffered.name,
          description: item.itemOffered.description,
        }),
      ),
    ).toEqual(
      offers.map((offer: { name: string; description: string }) => ({
        name: offer.name,
        description: offer.description,
      })),
    );
    await expect(page.locator('.vitrine-manifesto-intro')).toContainText(
      'faire exister, développer et faire connaître leur marque.',
    );
  } finally {
    await context.close();
  }
});

test('les projets et le contact complètent la vitrine sur bureau et mobile', async ({
  browser,
}, testInfo) => {
  test.setTimeout(60000);
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('main.vitrine')).toBeVisible();
      await page
        .getByRole('link', { name: 'Projets clients', exact: true })
        .click();
      await expect(page).toHaveURL(/#projets$/);
      await expect(
        page.getByRole('heading', { name: 'Les projets clients' }),
      ).toBeInViewport();
      await expect(page.locator('.vitrine-project')).toHaveCount(14);
      await page.getByText('Menu', { exact: true }).click();
      await page.getByRole('link', { name: 'Contact', exact: true }).click();
      await expect(page).toHaveURL(/#contact$/);
      await expect(
        page.getByRole('heading', { name: 'Contact', exact: true }),
      ).toBeInViewport();
      await page.getByLabel('Nom', { exact: true }).fill('Exemple');
      await page.getByLabel('Prénom', { exact: true }).fill('Camille');
      await page
        .getByLabel('Demande', { exact: true })
        .fill('Une demande de test pour un lancement de marque.');
      await expect(page.locator('.vitrine-contact-form')).toHaveAttribute(
        'action',
        'mailto:test@questboard.test',
      );
      await expect(
        page.getByRole('button', { name: 'Parlons de votre projet' }),
      ).toBeEnabled();
      for (const width of [1920, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (javaScriptEnabled && [1920, 375].includes(width)) {
          await page.screenshot({
            path: testInfo.outputPath(`vitrine-${width}.png`),
            fullPage: true,
          });
        }
      }
    } finally {
      await context.close();
    }
  }
});
