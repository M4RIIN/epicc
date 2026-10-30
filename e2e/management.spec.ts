import { createHash } from 'node:crypto';
import type { Client } from '@epicc/content-contracts';
import { expect, test } from '@playwright/test';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
  'base64',
);
const photo = (name: string) => ({ name, mimeType: 'image/png', buffer: png });
test.describe.configure({ mode: 'serial' });
for (const javaScriptEnabled of [false, true]) {
  test(`gestion simple, galerie et actions rapides avec JavaScript ${javaScriptEnabled}`, async ({
    browser,
    request,
  }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      await page.goto('/connect/clients/maison-sauge');
      await expect(page).toHaveURL(/\/connect$/);
      expect(
        (
          await request.post('/api/v1/admin/clients/maison-sauge', { data: '' })
        ).status(),
      ).toBe(401);
      await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
      await page.getByLabel('Mot de passe', { exact: true }).fill('incorrect');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByRole('alert')).toContainText(
        'Identifiants incorrects',
      );
      await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Gérer la vitrine',
      );
      expect(
        (
          await context.request.post('/connect', {
            form: { intent: 'publish', slug: 'maison-sauge', published: 'no' },
          })
        ).status(),
      ).toBe(403);
      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 812 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      await page.getByRole('link', { name: 'Ajouter un projet' }).click();
      await expect(
        page.getByLabel('Nom du projet', { exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel('Numéro de fiche')).toHaveCount(0);
      await page
        .getByLabel('Nom du projet', { exact: true })
        .fill('Client test');
      await page
        .getByLabel('Ajouter la photo principale', { exact: true })
        .setInputFiles({
          name: 'corrompu.png',
          mimeType: 'image/png',
          buffer: Buffer.from('image invalide'),
        });
      await page.getByRole('button', { name: 'Enregistrer le projet' }).click();
      await expect(page.getByRole('alert')).toContainText('JPEG, PNG ou WebP');
      await expect(
        page.getByLabel('Nom du projet', { exact: true }),
      ).toHaveValue('Client test');
      await page
        .getByLabel('Ajouter la photo principale', { exact: true })
        .setInputFiles(photo('principale.png'));
      await page
        .getByLabel('Description de la photo principale', { exact: true })
        .fill('Photo principale de test');
      await page
        .getByLabel('Ajouter des photos complémentaires', { exact: true })
        .setInputFiles([photo('detail-1.png'), photo('detail-2.png')]);
      if (javaScriptEnabled) {
        await expect(page.locator('.admin-preview')).toHaveCount(3);
        await expect(page.locator('.admin-preview').first()).toHaveAttribute(
          'src',
          /^blob:/,
        );
        await page
          .getByLabel('Description de la nouvelle photo 1', { exact: true })
          .fill('Premier détail');
        await page
          .getByLabel('Description de la nouvelle photo 2', { exact: true })
          .fill('Second détail');
        await expect(page.getByRole('status')).toContainText(
          'Modifications non enregistrées',
        );
      }
      await page.getByRole('button', { name: 'Enregistrer le projet' }).click();
      await expect(page).toHaveURL(
        /\/connect\/clients\/client-test\?enregistre=/,
      );
      await expect(page.getByRole('status')).toHaveText('Projet enregistré.');
      await expect(page.locator('.admin-preview')).toHaveCount(3);
      const privateImages = await page
        .locator('.admin-preview')
        .evaluateAll((images) =>
          images.map((image) => image.getAttribute('src')!),
        );
      const publicImages = privateImages.map((src) =>
        src.replace('/connect/images/', '/api/v1/client-images/'),
      );
      for (let i = 0; i < 3; i++) {
        expect((await context.request.get(privateImages[i]!)).status()).toBe(
          200,
        );
        expect((await request.get(publicImages[i]!)).status()).toBe(404);
      }
      expect(await (await request.get('/')).text()).not.toContain(
        'id="projet-client-test"',
      );
      await page.getByRole('link', { name: 'Tous les projets' }).click();
      const card = page.locator('.admin-project-card').filter({
        has: page.getByRole('heading', { name: 'Client test', exact: true }),
      });
      await card
        .getByRole('button', { name: 'Publier Client test', exact: true })
        .click();
      await expect(
        page.getByRole('status').filter({ hasText: 'Projet publié.' }),
      ).toBeVisible();
      await card
        .getByRole('button', { name: 'Monter Client test', exact: true })
        .click();
      await expect(
        page.getByRole('status').filter({ hasText: 'Ordre enregistré.' }),
      ).toBeVisible();
      await expect(
        page.locator('.admin-project-card').nth(5).getByRole('heading'),
      ).toHaveText('Client test');
      await page.goto('/#projet-client-test');
      await expect(page.locator('#projet-client-test img')).toHaveCount(3);
      await expect(page.locator('.vitrine-project').nth(5)).toHaveAttribute(
        'id',
        'projet-client-test',
      );
      for (const image of publicImages)
        expect((await request.get(image)).status()).toBe(200);
      expect((await request.get('/clients')).status()).toBe(404);
      await page.goto('/connect/clients/client-test');
      await page
        .getByLabel('Nom du projet', { exact: true })
        .fill('Client corrigé');
      await page
        .getByLabel('Remplacer la photo principale', { exact: true })
        .setInputFiles(photo('nouvelle-principale.png'));
      await page
        .getByLabel('Remplacer la photo 2', { exact: true })
        .setInputFiles(photo('nouveau-detail.png'));
      await page.getByLabel('Retirer la photo 3', { exact: true }).check();
      await page.getByRole('button', { name: 'Enregistrer le projet' }).click();
      await expect(page.getByRole('status')).toHaveText('Projet enregistré.');
      for (const image of publicImages)
        expect((await request.get(image)).status()).toBe(404);
      const updatedImages = await page
        .locator('.admin-preview')
        .evaluateAll((images) =>
          images.map((image) =>
            image
              .getAttribute('src')!
              .replace('/connect/images/', '/api/v1/client-images/'),
          ),
        );
      expect(updatedImages).toHaveLength(2);
      for (const width of [320, 375, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      await page.screenshot({
        path: testInfo.outputPath('gestion-projet.png'),
        fullPage: true,
      });
      await page.goto('/#projet-client-test');
      await expect(page.locator('#projet-client-test h3')).toHaveText(
        'Client corrigé',
      );
      await expect(page.locator('#projet-client-test img')).toHaveCount(2);
      await page.goto('/connect');
      await page
        .getByRole('button', { name: 'Masquer Client corrigé', exact: true })
        .click();
      await expect(
        page.getByRole('status').filter({ hasText: 'Projet masqué.' }),
      ).toBeVisible();
      for (const image of updatedImages)
        expect((await request.get(image)).status()).toBe(404);
      expect(await (await request.get('/')).text()).not.toContain(
        'id="projet-client-test"',
      );
      await page.getByRole('link', { name: 'Modifier Client corrigé' }).click();
      await page.getByText('Supprimer ce projet', { exact: true }).click();
      await page
        .getByLabel('Je confirme la suppression de Client corrigé')
        .check();
      await page
        .getByRole('button', { name: 'Supprimer définitivement' })
        .click();
      await expect(page).toHaveURL(/\/connect$/);
      await expect(
        page.getByRole('link', { name: 'Modifier Client corrigé' }),
      ).toHaveCount(0);
      await page.getByRole('button', { name: 'Se déconnecter' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Connexion à la gestion',
      );
    } finally {
      await context.close();
    }
  });
}

test('les deux colonnes suivent les placements de la capture sans aligner leurs projets par rangées', async ({
  page,
  request,
}, testInfo) => {
  const authorization = `Bearer ${createHash('sha256').update('clients-api:secret-de-test-deterministe-avec-plus-de-32-caracteres').digest('hex')}`;
  const headers = { authorization };
  const originals = (await (
    await request.get('/api/v1/admin/clients', { headers })
  ).json()) as Client[];
  const counts = [4, 2, 2, 2, 1, 2];
  try {
    for (const [index, original] of originals.entries()) {
      let current = original;
      for (let extra = 1; extra < counts[index]!; extra++) {
        const response = await request.post(
          `/api/v1/admin/clients/${original.slug}`,
          {
            headers,
            multipart: {
              client: JSON.stringify(current),
              galleryImage: photo(`detail-${extra}.png`),
              galleryAlt: `Détail de test ${extra}`,
            },
          },
        );
        expect(response.status()).toBe(200);
        current = (
          (await (
            await request.get('/api/v1/admin/clients', { headers })
          ).json()) as Client[]
        ).find((client) => client.slug === original.slug)!;
      }
    }
    await page.setViewportSize({ width: 680, height: 1000 });
    await page.goto('/#projets-clients');
    await expect(page.locator('.vitrine-loading')).toBeHidden({
      timeout: 15000,
    });
    const figures = page.locator('.vitrine-project');
    const tops = await figures.evaluateAll((nodes) =>
      nodes.map(
        (node) => node.querySelector('img')!.getBoundingClientRect().top,
      ),
    );
    const reference = [23, 0, 452, 223, 720, 488];
    for (const [index, top] of tops.entries())
      expect(top - tops[1]!).toBeCloseTo(reference[index]!, 0);
    const photos = await page
      .locator('.vitrine-project img')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );
    const expected = [
      [79, 101],
      [43, 67],
      [62, 95],
      [87, 130],
      [41, 61],
      [81, 143],
      [57, 92],
      [101, 153],
      [105, 158],
      [49, 86],
      [83, 125],
      [81, 147],
      [101, 103],
    ];
    for (const [index, image] of photos.entries()) {
      expect(image.width).toBeCloseTo(expected[index]![0]!, 0);
      expect(image.height).toBeCloseTo(expected[index]![1]!, 0);
    }
    await page
      .locator('#projets-clients')
      .screenshot({ path: testInfo.outputPath('composition-reference.png') });
    for (const width of [320, 375, 1920]) {
      await page.setViewportSize({ width, height: 1080 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  } finally {
    for (const original of originals) {
      const response = await request.post(
        `/api/v1/admin/clients/${original.slug}`,
        { headers, multipart: { client: JSON.stringify(original) } },
      );
      expect(response.status()).toBe(200);
    }
  }
});
