import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
for (const javaScriptEnabled of [false, true]) {
  test(`gestion sans anciennes fiches avec JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      await page.goto('/connect');
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Gérer les clients',
      );
      await expect(
        page.getByRole('heading', { name: 'Les projets clients', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Images des offres' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Ajouter un client' }),
      ).toHaveCount(0);
      await expect(page.locator('a[href^="/connect/clients"]')).toHaveCount(0);
      const denied = await context.request.post('/connect', {
        form: { intent: 'logout' },
      });
      expect(denied.status()).toBe(403);
      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 812 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      expect(
        (await context.request.get('/connect/clients/nouveau')).status(),
      ).toBe(404);
      await page.getByRole('button', { name: 'Se déconnecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Connexion à la gestion',
      );
    } finally {
      await context.close();
    }
  });
}

for (const javaScriptEnabled of [false, true]) {
  test(`images des offres dans la grille adaptative avec JavaScript ${javaScriptEnabled}`, async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      await page.goto('/connect/offres/creation-de-marque');
      await expect(page).toHaveURL(/\/connect$/);
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Gérer les clients',
      );
      expect(
        (
          await context.request.post('/connect/offres/creation-de-marque', {
            form: { alt: 'Refus sans CSRF' },
          })
        ).status(),
      ).toBe(403);
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
        'base64',
      );
      const slugs = ['creation-de-marque', 'restructuration-de-restaurants'];
      for (const slug of slugs) {
        await page.goto(`/connect/offres/${slug}`);
        await page.getByLabel('Texte alternatif de l’image').fill('');
        await page
          .getByLabel('Remplacer par une image', { exact: true })
          .setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: png,
          });
        await page.getByRole('button', { name: 'Enregistrer l’image' }).click();
        await expect(page.getByRole('alert')).toContainText('Décrivez l’image');
        await page
          .getByLabel('Texte alternatif de l’image')
          .fill(`Visuel de test ${slug}`);
        await page
          .getByLabel('Remplacer par une image', { exact: true })
          .setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: png,
          });
        await page.getByRole('button', { name: 'Enregistrer l’image' }).click();
        await expect(page).toHaveURL(/\/connect$/);
      }
      await page.goto('/');
      const visuals = page.locator('.vitrine-offer-visual');
      await expect(visuals).toHaveCount(2);
      const images: string[] = [];
      for (let index = 0; index < 2; index++) {
        const image = visuals.nth(index).locator('img');
        await expect(image).toHaveAttribute(
          'alt',
          `Visuel de test ${slugs[index]}`,
        );
        images.push((await image.getAttribute('src'))!);
        expect(
          (await request.get(images[index]!)).headers()['content-type'],
        ).toBe('image/png');
      }
      for (const width of [1440, 375, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const slug of slugs) {
          const offer = page.locator(`[data-offer="${slug}"]`);
          const image = offer.locator('.vitrine-offer-visual img');
          await expect(image).toBeVisible();
          const bounds = (await image.boundingBox())!;
          const column = (await offer.boundingBox())!;
          expect(bounds.width).toBeGreaterThan(0);
          expect(bounds.width).toBeCloseTo(column.width, 1);
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      for (const slug of slugs) {
        await page.goto(`/connect/offres/${slug}`);
        await expect(
          page
            .getByRole('form', { name: 'Image dans la page', exact: true })
            .locator('.admin-preview'),
        ).toBeVisible();
        await page.getByLabel('Retirer l’image actuelle').check();
        await page.getByRole('button', { name: 'Enregistrer l’image' }).click();
        await expect(page).toHaveURL(/\/connect$/);
      }
      for (const image of images)
        expect((await request.get(image)).status()).toBe(404);
      await page.goto('/');
      await expect(page.locator('.vitrine-offer-visual')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}

for (const javaScriptEnabled of [false, true]) {
  test(`remplacement des projets clients sans changer la composition, JavaScript ${javaScriptEnabled}`, async ({
    browser,
    request,
  }, testInfo) => {
    test.setTimeout(60000);
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      const layout = async () =>
        page.locator('.vitrine-project-piece').evaluateAll((pieces) =>
          pieces.map((piece) => {
            const rect = piece.getBoundingClientRect();
            const image = piece.querySelector('img')!;
            return {
              width: rect.width,
              height: rect.height,
              left: rect.left,
              top: (piece as HTMLElement).offsetTop,
              fit: getComputedStyle(image).objectFit,
              transform: getComputedStyle(image).transform,
            };
          }),
        );
      const before = [];
      for (const width of [1440, 375, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.locator('main.vitrine')).toBeVisible();
        before.push(await layout());
      }
      const target = '/connect/projets/Rectangle5.png';
      await page.goto(target);
      await expect(page).toHaveURL(/\/connect$/);
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(
        page.getByRole('heading', { name: 'Les projets clients', exact: true }),
      ).toBeVisible();
      await expect(page.locator('.admin-project-images img')).toHaveCount(32);
      await expect(
        page.getByRole('heading', { name: 'Colonne gauche' }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Colonne droite' }),
      ).toBeVisible();
      const viandeCard = page.getByRole('article', {
        name: 'Viande des Sorgues',
        exact: true,
      });
      await expect(viandeCard.locator('.admin-project-titles img')).toHaveCount(
        1,
      );
      await expect(viandeCard.locator('.admin-project-photos img')).toHaveCount(
        4,
      );
      const adminTitle = (await viandeCard
        .locator('.admin-project-titles img')
        .first()
        .boundingBox())!;
      const adminPhoto = (await viandeCard
        .locator('.admin-project-photos img')
        .first()
        .boundingBox())!;
      expect(Math.abs(adminTitle.y - adminPhoto.y)).toBeLessThan(1);

      await expect(
        viandeCard.locator('.admin-project-photos a').nth(1),
      ).toHaveAttribute('href', '/connect/projets/Rectangle4.png');
      await expect(
        page
          .getByRole('article', { name: 'Annafurna', exact: true })
          .locator('.admin-project-photos img'),
      ).toHaveCount(2);

      expect(
        (
          await context.request.post(target, { form: { alt: 'Sans CSRF' } })
        ).status(),
      ).toBe(403);
      expect(
        (
          await request.post('/api/v1/admin/project-images/Rectangle5.png')
        ).status(),
      ).toBe(401);
      await page
        .getByRole('link', { name: 'Modifier l’image 1 de Viande des Sorgues' })
        .click();
      const alt = 'Nouveau visuel du projet de test';
      await page.getByLabel('Texte alternatif de l’image').fill(alt);
      await page.getByLabel('Remplacer par une image').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
          'base64',
        ),
      });
      await page.getByRole('button', { name: 'Enregistrer l’image' }).click();
      await expect(page).toHaveURL(/\/connect#project-images$/);
      if (javaScriptEnabled) {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.screenshot({
          path: testInfo.outputPath('gestion-projets.png'),
          fullPage: true,
        });
      }
      let src = '';
      for (const [index, width] of [1440, 375, 320].entries()) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.locator('main.vitrine')).toBeVisible();
        const image = page.getByRole('img', { name: alt, exact: true });
        await expect(image).toHaveAttribute('width', '222');
        await expect(image).toHaveAttribute('height', '283');
        src = (await image.getAttribute('src'))!;
        expect(await layout()).toEqual(before[index]);
      }
      expect((await request.get(src)).headers()['content-type']).toBe(
        'image/png',
      );
      const html = await (await request.get('/')).text();
      expect(html).toContain(`alt="${alt}"`);
      expect(html).toContain('rel="canonical"');
      expect(await (await request.get('/robots.txt')).text()).toContain(
        'Allow: /api/v1/project-images/',
      );
      await page.goto(target);
      expect((await page.request.get(target)).headers()['x-robots-tag']).toBe(
        'noindex, nofollow',
      );
      await page.getByRole('button', { name: 'Rétablir l’original' }).click();
      await expect(page).toHaveURL(/\/connect#project-images$/);
      expect((await request.get(src)).status()).toBe(404);
      await page.goto('/');
      await expect(
        page.getByRole('img', {
          name: 'Gros plan sur une tomate rouge.',
          exact: true,
        }),
      ).toHaveAttribute('src', /^\/api\/v1\/project-images\//);
    } finally {
      await context.close();
    }
  });
}

for (const javaScriptEnabled of [false, true]) {
  test(`photos multiples, tailles et clients séparés, JavaScript ${javaScriptEnabled}`, async ({
    browser,
  }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({
      javaScriptEnabled,
      viewport: { width: 1440, height: 1000 },
    });
    const files: string[] = [];
    try {
      const page = await context.newPage();
      await page.goto('/connect');
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      const card = page.getByRole('article', { name: 'Deux Mnu', exact: true });
      await expect(card.locator('.admin-project-titles img')).toHaveCount(1);
      await expect(
        page
          .getByRole('article', { name: 'L’Écluse Douze', exact: true })
          .locator('.admin-project-titles img'),
      ).toHaveCount(1);
      const originalLinks = await card
        .locator('.admin-project-photos a')
        .evaluateAll((items) =>
          items.map((item) => item.getAttribute('href')!),
        );
      for (const size of ['small', 'medium', 'large']) {
        await card.getByRole('link', { name: 'Ajouter une photo' }).click();
        await page.getByLabel('Taille d’affichage').selectOption(size);
        await page
          .getByLabel('Texte alternatif de l’image')
          .fill(`Photo de test ${size}`);
        await page.getByLabel('Photo à ajouter').setInputFiles({
          name: 'photo.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
            'base64',
          ),
        });
        await page.getByRole('button', { name: 'Ajouter la photo' }).click();
        await expect(page).toHaveURL(/\/connect#project-images$/);
        const links = await card
          .locator('.admin-project-photos a')
          .evaluateAll((items) =>
            items.map((item) => item.getAttribute('href')!),
          );
        files.push(
          ...links.filter(
            (link) => !originalLinks.includes(link) && !files.includes(link),
          ),
        );
      }
      expect(files).toHaveLength(3);
      await page.reload();
      await expect(card.locator('.admin-project-photos img')).toHaveCount(
        originalLinks.length + 3,
      );
      await page.goto('/');
      await expect(
        page
          .getByRole('figure', { name: 'Deux Main', exact: true })
          .locator('.vitrine-project-photo'),
      ).toHaveCount(originalLinks.length + 3);
      const widths = [];
      for (const size of ['small', 'medium', 'large']) {
        const photo = page.getByRole('img', {
          name: `Photo de test ${size}`,
          exact: true,
        });
        await expect(photo).toHaveAttribute(
          'src',
          /^\/api\/v1\/project-images\//,
        );
        widths.push((await photo.boundingBox())!.width);
      }
      expect(widths[0]!).toBeLessThan(widths[1]!);
      expect(widths[1]!).toBeLessThan(widths[2]!);
      await page.goto(files[0]!);
      await page.getByLabel('Taille d’affichage').selectOption('large');
      await page.getByRole('button', { name: 'Enregistrer l’image' }).click();
      await expect(page).toHaveURL(/\/connect#project-images$/);
      await page.goto(files[0]!);
      await expect(page.getByLabel('Taille d’affichage')).toHaveValue('large');
    } finally {
      const page = await context.newPage();
      try {
        for (const file of files) {
          await page.goto(file);
          await page
            .getByLabel('Je confirme la suppression de cette photo')
            .check();
          await page
            .getByRole('button', { name: 'Supprimer la photo', exact: true })
            .click();
          await expect(page).toHaveURL(/\/connect#project-images$/);
        }
      } finally {
        await context.close();
      }
    }
  });
}
