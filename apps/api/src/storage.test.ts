import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { Database } from './database';
import {
  createAdministrator,
  resetAdministratorPassword,
} from './create-admin';
import { composeApi } from './composition-root';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

const secret = 'secret-de-test-de-plus-de-trente-deux-caracteres';
const authorization = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
  'base64',
);
let database: Database;
let name: string;
beforeEach(async () => {
  vi.stubEnv('ADMIN_EMAIL', 'test@questboard.test');
  vi.stubEnv('ADMIN_PASSWORD', 'testtest');
  vi.stubEnv('SESSION_SECRET', secret);
  name = testDatabaseName('storage');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await database?.close();
  if (name) await manageTestDatabase(name, false);
});
it('authentifie le compte PostgreSQL haché après redémarrage, même sans mot de passe dans l’environnement', async () => {
  const result = await database.pool.query(
    'SELECT password_hash FROM administrators',
  );
  expect(result.rows[0].password_hash).not.toContain('testtest');
  expect(await database.authenticate('test@questboard.test', 'incorrect')).toBe(
    false,
  );
  expect(
    await database.authenticate('inconnu@questboard.test', 'testtest'),
  ).toBe(false);
  vi.stubEnv('ADMIN_PASSWORD', '');
  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
  const api = composeApi(database);
  const login = (password: string, authenticated = true) =>
    api.request('/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated ? { authorization } : {}),
      },
      body: JSON.stringify({ email: 'test@questboard.test', password }),
    });
  expect((await login('testtest', false)).status).toBe(401);
  expect((await login('incorrect')).status).toBe(401);
  expect((await login('testtest')).status).toBe(200);
  for (let index = 0; index < 20; index++) await login('incorrect');
  expect((await login('testtest')).status).toBe(429);
});
it('enregistre et remplace les images des offres, protège les écritures et nettoie les images orphelines', async () => {
  let api = composeApi(database);
  const path = '/v1/admin/offers/creation-de-marque';
  expect((await api.request(path, { method: 'POST' })).status).toBe(401);
  const post = (
    alt: string,
    image?: File,
    remove = false,
    target = 'image',
  ) => {
    const form = new FormData();
    form.set('alt', alt);
    form.set('target', target);
    if (image) form.set('image', image);
    if (remove) form.set('removeImage', 'yes');
    return api.request(path, {
      method: 'POST',
      headers: { authorization },
      body: form,
    });
  };
  expect(
    (
      await post(
        'Test',
        new File(['invalide'], 'test.png', { type: 'image/png' }),
      )
    ).status,
  ).toBe(400);
  expect(
    (await post('', new File([png], 'test.png', { type: 'image/png' }))).status,
  ).toBe(400);
  expect(
    (
      await post(
        'Visuel de test',
        new File([png], 'test.png', { type: 'image/png' }),
      )
    ).status,
  ).toBe(200);
  const before = await database.pool.query(
    'SELECT content FROM offers WHERE slug = $1',
    ['creation-de-marque'],
  );
  const firstImage = before.rows[0].content.image as string;
  expect(
    (
      await post(
        'Visuel au survol',
        new File([png], 'survol.png', { type: 'image/png' }),
        false,
        'hover',
      )
    ).status,
  ).toBe(200);
  const hoverImage = (
    await database.pool.query('SELECT content FROM offers WHERE slug = $1', [
      'creation-de-marque',
    ])
  ).rows[0].content.hoverImage as string;

  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
  api = composeApi(database);
  const response = await api.request(firstImage.replace('/api', ''));
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toBe('image/png');
  expect(Buffer.from(await response.arrayBuffer())).toEqual(png);
  expect(
    (
      await post(
        'Nouveau visuel',
        new File([png], 'test.png', { type: 'image/png' }),
      )
    ).status,
  ).toBe(200);
  expect((await api.request(firstImage.replace('/api', ''))).status).toBe(404);
  expect((await post('', undefined, true)).status).toBe(200);
  expect((await api.request(hoverImage.replace('/api', ''))).status).toBe(200);
  expect(
    (await database.pool.query('SELECT count(*) FROM images')).rows[0].count,
  ).toBe('1');
  expect((await post('', undefined, true, 'hover')).status).toBe(200);
  expect((await api.request(hoverImage.replace('/api', ''))).status).toBe(404);

  expect(
    (await database.pool.query('SELECT count(*) FROM images')).rows[0].count,
  ).toBe('0');
  expect((await api.request('/v1/offer-images/invalide')).status).toBe(404);
});
it('annule entièrement une écriture en échec', async () => {
  await expect(
    database.transaction(async (connection) => {
      await connection.query('DELETE FROM offers');
      throw new Error('Échec de test');
    }),
  ).rejects.toThrow('Échec de test');
  expect(
    (await database.pool.query('SELECT count(*) FROM offers')).rows[0].count,
  ).toBe('6');
});

it('crée un administrateur persistant sans écraser un compte existant', async () => {
  await database.pool.query('DELETE FROM administrators');
  await database.migrate({ provisionAdmin: false });
  expect(
    (await database.pool.query('SELECT count(*) FROM administrators')).rows[0]
      .count,
  ).toBe('0');
  await createAdministrator(database, 'TEST@questboard.test', 'testtest');
  expect(await database.authenticate('test@questboard.test', 'testtest')).toBe(
    true,
  );
  await expect(
    createAdministrator(database, 'test@questboard.test', 'autremotdepasse'),
  ).rejects.toThrow('existe déjà');
  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
  expect(await database.authenticate('test@questboard.test', 'testtest')).toBe(
    true,
  );
  expect(
    await database.authenticate('test@questboard.test', 'autremotdepasse'),
  ).toBe(false);
  const result = await database.pool.query(
    'SELECT password_hash FROM administrators WHERE email = $1',
    ['test@questboard.test'],
  );
  expect(result.rows[0].password_hash).not.toContain('testtest');
});

it('réinitialise seulement le compte ciblé et conserve son nouveau mot de passe au redémarrage', async () => {
  await createAdministrator(database, 'autre@questboard.test', 'testtest');
  await resetAdministratorPassword(
    database,
    ' TEST@questboard.test ',
    'nouveau-mot-de-passe-de-test',
  );
  expect(await database.authenticate('test@questboard.test', 'testtest')).toBe(
    false,
  );
  expect(
    await database.authenticate(
      'test@questboard.test',
      'nouveau-mot-de-passe-de-test',
    ),
  ).toBe(true);
  expect(await database.authenticate('autre@questboard.test', 'testtest')).toBe(
    true,
  );
  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
  expect(
    await database.authenticate(
      'test@questboard.test',
      'nouveau-mot-de-passe-de-test',
    ),
  ).toBe(true);
});

it('refuse une réinitialisation invalide ou un compte absent sans modifier les comptes existants', async () => {
  await expect(
    resetAdministratorPassword(
      database,
      'absent@questboard.test',
      'nouveau-mot-de-passe-de-test',
    ),
  ).rejects.toThrow('introuvable');
  await expect(
    resetAdministratorPassword(database, 'test@questboard.test', 'court'),
  ).rejects.toThrow();
  expect(await database.authenticate('test@questboard.test', 'testtest')).toBe(
    true,
  );
  expect(
    (await database.pool.query('SELECT count(*) FROM administrators')).rows[0]
      .count,
  ).toBe('1');
});

it('met à jour les offres d’origine sans perdre les images ni écraser les textes personnalisés', async () => {
  const { previousOffers, initialOffers } = await import('./offers.seed');
  const image = '/api/v1/offer-images/00000000-0000-0000-0000-000000000066';
  await database.pool.query('DELETE FROM offers');
  await database.pool.query(
    "DELETE FROM migrations WHERE id='vitrine-offers-2026-11'",
  );
  for (const offer of previousOffers) {
    await database.pool.query('INSERT INTO offers VALUES ($1, $2)', [
      offer.slug,
      {
        ...offer,
        image,
        alt: 'Visuel de test conservé',
        ...(offer.slug === 'evenementiel'
          ? {
              name: 'Une offre personnalisée',
              description: 'Une description personnalisée.',
            }
          : {}),
      },
    ]);
  }
  await database.migrate();
  const rows = (
    await database.pool.query('SELECT content FROM offers')
  ).rows.map((row) => row.content);
  expect(rows).toHaveLength(6);
  const launch = rows.find((offer) => offer.slug === 'creation-de-marque');
  expect(launch).toEqual({
    ...initialOffers[0],
    image,
    alt: 'Visuel de test conservé',
  });
  expect(rows.find((offer) => offer.slug === 'evenementiel')).toMatchObject({
    name: 'Une offre personnalisée',
    description: 'Une description personnalisée.',
    image,
  });
  await database.pool.query("DELETE FROM offers WHERE slug='graphisme'");
  await database.migrate();
  expect(
    (await database.pool.query("SELECT 1 FROM offers WHERE slug='graphisme'"))
      .rowCount,
  ).toBe(0);
});
