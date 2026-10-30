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
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7XcAAAAASUVORK5CYII=',
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
      await expect(page).toHaveURL(/\/connect$/);
      expect((await request.get('/clients/client-test')).status()).toBe(404);
      expect(await (await request.get('/sitemap.xml')).text()).not.toContain(
        '/clients/client-test',
      );
      expect(await (await request.get('/clients')).text()).not.toContain(
        'Découvrir Client de test',
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
      const published = await request.get('/clients/client-test');
      expect(published.status()).toBe(200);
      const html = await published.text();
      expect(html).toContain('Description publique du client de test.');
      expect(html).toContain(
        'name="description" content="Description publique du client de test."',
      );
      expect(html).toContain(
        'rel="canonical" href="http://127.0.0.1:3190/clients/client-test"',
      );
      expect(html).toContain('alt="Image de test déterministe"');
      expect((await request.get(publicImage)).headers()['content-type']).toBe(
        'image/png',
      );
      expect(await (await request.get('/sitemap.xml')).text()).toContain(
        '/clients/client-test',
      );
      await page.goto('/clients?secteur=Univers+de+test');
      await expect(page.getByRole('link', { name: /^Découvrir / })).toHaveCount(
        1,
      );
      await page.goto('/connect');
      await page.getByRole('link', { name: 'Modifier Client de test' }).click();
      await page.getByLabel('Nom', { exact: true }).fill('Client corrigé');
      await page.getByLabel('Ordre d’affichage').fill('999');
      await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
      await expect(page).toHaveURL(/\/connect$/);
      await page.goto('/clients');
      await expect(
        page.getByRole('link', { name: /^Découvrir / }).last(),
      ).toHaveAccessibleName('Découvrir Client corrigé');
      await page.goto('/connect');
      await page.getByRole('link', { name: 'Modifier Client corrigé' }).click();
      await page
        .getByLabel('Je confirme la suppression de Client corrigé')
        .check();
      await page
        .getByRole('button', { name: 'Supprimer définitivement' })
        .click();
      await expect(page).toHaveURL(/\/connect$/);
      expect((await request.get('/clients/client-test')).status()).toBe(404);
      expect((await request.get(publicImage)).status()).toBe(404);
      expect(await (await request.get('/sitemap.xml')).text()).not.toContain(
        '/clients/client-test',
      );
      await page.getByRole('button', { name: 'Se déconnecter' }).click();
      await page.goto('/connect/clients/maison-sauge');
      await expect(page).toHaveURL(/\/connect$/);
    } finally {
      await context.close();
    }
  });
}
