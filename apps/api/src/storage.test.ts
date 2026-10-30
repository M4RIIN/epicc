import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { Database } from './database';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importSqlite } from './import-sqlite';
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
  const post = (alt: string, image?: File, remove = false) => {
    const form = new FormData();
    form.set('alt', alt);
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
  ).toBe('5');
});

it('reprend SQLite sans modifier la source et refuse une seconde importation', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'epicc-import-'));
  const path = join(directory, 'clients.sqlite');
  const source = new DatabaseSync(path);
  const client = (
    await database.pool.query('SELECT content FROM clients LIMIT 1')
  ).rows[0].content;
  const id = '00000000-0000-4000-8000-000000000001';
  const importedClient = {
    ...client,
    name: 'Client importé',
    image: `/api/v1/client-images/${id}`,
    published: false,
  };
  source.exec(
    'CREATE TABLE clients (slug TEXT PRIMARY KEY, content TEXT NOT NULL); CREATE TABLE images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, content BLOB NOT NULL)',
  );
  source
    .prepare('INSERT INTO clients VALUES (?, ?)')
    .run(client.slug, JSON.stringify(importedClient));
  source
    .prepare('INSERT INTO images VALUES (?, ?, ?)')
    .run(id, 'image/png', png);
  source.close();
  try {
    await importSqlite(database, path);
    expect(
      (await database.pool.query('SELECT content FROM clients')).rows.map(
        (row) => row.content,
      ),
    ).toEqual([importedClient]);
    expect(
      (
        await database.pool.query('SELECT content FROM images WHERE id = $1', [
          id,
        ])
      ).rows[0].content,
    ).toEqual(png);
    await expect(importSqlite(database, path)).rejects.toThrow('déjà reçu');
    const original = new DatabaseSync(path, { readOnly: true });
    try {
      expect(
        original.prepare('SELECT content FROM clients').all(),
      ).toHaveLength(1);
    } finally {
      original.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
it('préserve une liste SQLite vide au prochain démarrage et refuse un import après modification PostgreSQL', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'epicc-import-vide-'));
  const path = join(directory, 'clients.sqlite');
  const source = new DatabaseSync(path);
  source.exec(
    'CREATE TABLE clients (slug TEXT PRIMARY KEY, content TEXT NOT NULL); CREATE TABLE images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, content BLOB NOT NULL)',
  );
  source.close();
  try {
    await database.pool.query(
      "INSERT INTO migrations VALUES ('postgres-edited')",
    );
    await expect(importSqlite(database, path)).rejects.toThrow(
      'déjà été modifiée',
    );
    expect(
      (await database.pool.query('SELECT count(*) FROM clients')).rows[0].count,
    ).toBe('6');
    await database.pool.query(
      "DELETE FROM migrations WHERE id = 'postgres-edited'",
    );
    await importSqlite(database, path);
    await database.migrate();
    expect(
      (await database.pool.query('SELECT count(*) FROM clients')).rows[0].count,
    ).toBe('0');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
