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
  expect(html).toContain('Accompagner les acteurs de la restauration');
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'EPICC — Communication pour la restauration et l’agroalimentaire',
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Chloé Gathla accompagne/,
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
    'EPICC — Communication',
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

test('la vitrine est la seule page publique et le sitemap ne référence aucun ancien client', async ({
  request,
}) => {
  for (const path of [
    '/clients',
    '/clients/maison-sauge',
    '/clients/inconnu',
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('/clients');
  expect(sitemap.match(/<loc>/g)).toHaveLength(1);
});

test('les projets sont intégrés à la vitrine sans page séparée et restent lisibles sur mobile', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const projects = page.locator('#projets-clients');
    await expect(
      projects.getByRole('heading', { name: 'Les projets clients' }),
    ).toBeVisible();
    await expect(projects.locator('figure')).toHaveCount(6);
    await expect(
      projects.locator('figure').first().getByRole('heading'),
    ).toHaveText('Maison Sauge');
    await expect(page.locator('a[href^="/clients"]')).toHaveCount(0);
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const large = (await projects.locator('figure').nth(0).boundingBox())!;
      const small = (await projects.locator('figure').nth(1).boundingBox())!;
      expect(large.width).toBeGreaterThan(small.width * 1.5);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  } finally {
    await context.close();
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
    await page
      .getByRole('link', { name: 'Les projets clients', exact: true })
      .click();
    await expect(page).toHaveURL(/#projets-clients$/);
    await expect(page.locator('#projects-title')).toBeInViewport();
  } finally {
    await context.close();
  }
});

test('les visuels et la typographie de la vitrine sont servis localement', async ({
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
  const images = await page
    .locator('.vitrine img[src^="/images/vitrine/"]')
    .evaluateAll((images) =>
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
    expect(image.src).toMatch(/^\/images\/vitrine\//);
    expect(image.loaded).toBe(true);
    expect(image.visible).toBe(true);
  }
  const vectors = await page
    .locator('.vitrine svg image')
    .evaluateAll((images) =>
      images.map((image) => image.getAttribute('href')!),
    );
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

test('la connexion reste directement accessible sans JavaScript et les visuels utilisent leurs originaux', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.vitrine-loading')).toBeHidden();
    const connection = page.getByRole('link', {
      name: 'Connexion',
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
      '/images/vitrine/Image29102026A17281.png',
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

test('l’écran de chargement attend aussi la dernière illustration avant de révéler toutes les images', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/images/vitrine/Group16.svg', async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.vitrine-loading')).toBeVisible();
    await expect(page.locator('main.vitrine')).toBeHidden();
    release();
    await expect(page.locator('.vitrine-loading')).toBeHidden({
      timeout: 15000,
    });
    await expect(page.locator('main.vitrine')).toBeVisible();
    expect(
      await page.locator('.vitrine img').evaluateAll((images) =>
        images.every((node) => {
          const image = node as HTMLImageElement;
          return image.complete && image.naturalWidth > 0;
        }),
      ),
    ).toBe(true);
    await page.reload();
    await expect(page.locator('.vitrine-loading')).toBeHidden({
      timeout: 15000,
    });
    await expect(page.locator('main.vitrine')).toBeVisible();
  } finally {
    release();
  }
});

test('une image en erreur ne bloque pas le chargement', async ({ page }) => {
  await page.route('**/images/vitrine/Group16.svg', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.vitrine-loading')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('main.vitrine')).toBeVisible();
});

test('un chargement lent permet de continuer ou de rejoindre la gestion', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.clock.install();
  await page.route(
    '**/images/vitrine/Image29102026A17281.png',
    async (route) => {
      await pending;
      await route.continue();
    },
  );
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute(
      'data-home-loading',
      'true',
    );
    await expect(
      page
        .locator('.vitrine-loading')
        .getByRole('link', { name: 'Connexion à la gestion' }),
    ).toBeVisible();
    await page.clock.fastForward(12001);
    await expect(
      page.getByText('Le chargement prend plus de temps que prévu.'),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Afficher le site sans attendre' })
      .click();
    await expect(page.locator('.vitrine-loading')).toBeHidden();
    await expect(page.locator('main.vitrine')).toBeVisible();
  } finally {
    release();
  }
});
