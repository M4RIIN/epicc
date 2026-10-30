import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
for (const javaScriptEnabled of [false, true]) {
  test(`gestion complète avec JavaScript ${javaScriptEnabled ? 'activé' : 'désactivé'}, images et référencement synchronisés`, async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      await page.goto('/connect/clients/maison-sauge');
      await expect(page).toHaveURL(/\/connect$/);
      const denied = await request.post('/api/v1/admin/clients/maison-sauge', {
        data: '',
      });
      expect(denied.status()).toBe(401);
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('incorrect');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByRole('alert')).toContainText(
        'Identifiants incorrects',
      );
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Gérer les clients',
      );
      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 812 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      }
      await expect(
        page.getByRole('heading', { name: 'Projets clients' }),
      ).toBeVisible();
      await expect(page.locator('a[href^="/connect/offres/"]')).toHaveCount(0);
      expect(
        (await request.get('/connect/offres/creation-de-marque')).status(),
      ).toBe(404);
      // Une écriture avec cookie mais sans jeton CSRF doit échouer.
      const csrfDenied = await context.request.post(
        '/connect/clients/maison-sauge',
        { form: { intent: 'delete', confirmDelete: 'yes' } },
      );
      expect(csrfDenied.status()).toBe(403);
      await page.getByRole('link', { name: 'Ajouter un client' }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.setViewportSize({ width: 1280, height: 900 });
      const fields = [
        ['Adresse de la fiche', 'client-test'],
        ['Nom', 'Client de test'],
        ['Numéro de fiche', '07'],
        ['Univers', 'Univers de test'],
        ['Ville', 'Lyon'],
        ['Année', '2026'],
        ['Légende de l’image', 'Une image de test'],
        [
          'Présentation et description SEO',
          'Description publique du client de test.',
        ],
        ['Besoin du client', 'Un besoin de test.'],
        ['Prestations (séparées par « · »)', 'Identité · Site'],
        ['Note dans la marge', 'Une note de test.'],
        ['Signature du client', 'Équipe de test'],
        ['Texte alternatif de l’image', 'Image de test déterministe'],
        ['Ordre d’affichage', '0'],
      ];
      for (const [label, value] of fields)
        await page.getByLabel(label!, { exact: true }).fill(value!);
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
        'base64',
      );
      await page
        .getByLabel('Remplacer par une image', { exact: true })
        .setInputFiles({
          name: 'test.png',
          mimeType: 'image/png',
          buffer: png,
        });
      await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
      await expect(page).toHaveURL(/\/connect$/);
      expect((await request.get('/clients/client-test')).status()).toBe(404);
      expect(await (await request.get('/sitemap.xml')).text()).not.toContain(
        '/clients/client-test',
      );
      expect(await (await request.get('/')).text()).not.toContain(
        'id="projet-client-test"',
      );
      await page.getByRole('link', { name: 'Modifier Client de test' }).click();
      const preview = page.locator('.admin-preview');
      const privateImage = await preview.getAttribute('src');
      expect((await context.request.get(privateImage!)).status()).toBe(200);
      const publicImage = privateImage!.replace(
        '/connect/images/',
        '/api/v1/client-images/',
      );
      expect((await request.get(publicImage)).status()).toBe(404);
      await page.getByLabel('Publier sur la vitrine').check();
      await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
      await expect(page).toHaveURL(/\/connect$/);
      await page.goto('/#projet-client-test');
      const project = page.locator('#projet-client-test');
      await expect(project.getByRole('heading')).toHaveText('Client de test');
      await expect(project.locator('img')).toHaveAttribute('src', publicImage);
      await expect(project.locator('img')).toHaveAttribute(
        'alt',
        'Image de test déterministe',
      );
      expect((await request.get(publicImage)).headers()['content-type']).toBe(
        'image/png',
      );
      expect((await request.get('/clients/client-test')).status()).toBe(404);
      await expect(page.locator('.vitrine-project').first()).toHaveAttribute(
        'id',
        'projet-client-test',
      );
      await page.goto('/connect');
      await page
        .getByRole('link', { name: 'Modifier l’image de Client de test' })
        .click();
      await expect(page).toHaveURL(/#image-projet$/);
      await expect(
        page.getByRole('group', { name: 'Image du projet client' }),
      ).toBeInViewport();
      await page
        .getByLabel('Remplacer par une image', { exact: true })
        .setInputFiles({
          name: 'remplacement.png',
          mimeType: 'image/png',
          buffer: png,
        });
      await page
        .getByLabel('Ajouter une photo au projet', { exact: true })
        .setInputFiles({
          name: 'detail.png',
          mimeType: 'image/png',
          buffer: png,
        });
      await page
        .getByLabel('Description de la nouvelle photo', { exact: true })
        .fill('Détail du projet de test');
      await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
      await expect(page).toHaveURL(/\/connect$/);
      expect((await request.get(publicImage)).status()).toBe(404);
      await page.goto('/');
      await expect(page.locator('#projet-client-test img')).toHaveCount(2);
      await expect(
        page.locator('#projet-client-test img').nth(1),
      ).toHaveAttribute('alt', 'Détail du projet de test');
      const replacementImage = await page
        .locator('#projet-client-test img')
        .first()
        .getAttribute('src');
      expect(replacementImage).not.toBe(publicImage);
      expect(replacementImage).toMatch(/^\/api\/v1\/client-images\//);
      expect(
        (await request.get(replacementImage!)).headers()['content-type'],
      ).toBe('image/png');
      await expect(
        page.locator('#projet-client-test img').first(),
      ).toHaveAttribute('alt', 'Image de test déterministe');
      await page.goto('/');
      await expect(page.locator('#prestations img[src^="/api/"]')).toHaveCount(
        0,
      );
      await page.goto('/connect');
      await page.getByRole('link', { name: 'Modifier Client de test' }).click();
      await expect(page.locator('.admin-preview')).toHaveCount(2);
      const galleryUrl = (await page
        .locator('.admin-preview')
        .nth(1)
        .getAttribute('src'))!.replace(
        '/connect/images/',
        '/api/v1/client-images/',
      );
      expect((await request.get(galleryUrl)).status()).toBe(200);
      await page.getByLabel('Retirer la photo 2', { exact: true }).check();
      await page.getByLabel('Nom', { exact: true }).fill('Client corrigé');
      await page.getByLabel('Ordre d’affichage').fill('999');
      await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
      await expect(page).toHaveURL(/\/connect$/);
      await page
        .getByRole('link', { name: 'Voir le projet sur la vitrine' })
        .last()
        .click();
      await expect(page).toHaveURL(/#projet-client-test$/);
      expect((await request.get(galleryUrl)).status()).toBe(404);
      await expect(page.locator('#projet-client-test img')).toHaveCount(1);
      await expect(
        page.locator('.vitrine-project').last().getByRole('heading'),
      ).toHaveText('Client corrigé');
      await page.goto('/connect');
      await page.getByRole('link', { name: 'Modifier Client corrigé' }).click();
      await page.getByLabel('Publier sur la vitrine').uncheck();
      await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
      await expect(page).toHaveURL(/\/connect$/);
      expect(await (await request.get('/')).text()).not.toContain(
        'id="projet-client-test"',
      );
      expect((await request.get(replacementImage!)).status()).toBe(404);
      await page.getByRole('link', { name: 'Modifier Client corrigé' }).click();
      await page
        .getByLabel('Je confirme la suppression de Client corrigé')
        .check();
      await page
        .getByRole('button', { name: 'Supprimer définitivement' })
        .click();
      await expect(page).toHaveURL(/\/connect$/);
      expect(await (await request.get('/')).text()).not.toContain(
        'id="projet-client-test"',
      );
      expect((await request.get(replacementImage!)).status()).toBe(404);
      expect(await (await request.get('/sitemap.xml')).text()).not.toContain(
        '/clients/client-test',
      );
      await page.getByRole('button', { name: 'Se déconnecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Connexion à la gestion',
      );
      await page.goto('/connect/clients/maison-sauge');
      await expect(page).toHaveURL(/\/connect$/);
    } finally {
      await context.close();
    }
  });
}
