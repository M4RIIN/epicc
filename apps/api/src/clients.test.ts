import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import { Database } from './database';
import { composeApi } from './composition-root';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

let database: Database;
let name: string;
beforeEach(async () => {
  name = testDatabaseName('retired_clients');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await database?.close();
  if (name) await manageTestDatabase(name, false);
});

it('retire les anciennes fiches et leurs médias seuls, sans réintroduire les exemples au redémarrage', async () => {
  const orphan = randomUUID();
  const shared = randomUUID();
  await database.pool.query(
    "DELETE FROM migrations WHERE id = 'remove-client-directory'",
  );
  for (const [index, id] of [orphan, shared].entries()) {
    await database.pool.query(
      'INSERT INTO images (id, mime, content, storage_key) VALUES ($1, $2, $3, $4)',
      [id, 'image/png', Buffer.from([1, 2, 3]), `media/${id}`],
    );
    await database.pool.query('INSERT INTO clients VALUES ($1, $2)', [
      `ancien-client-${index}`,
      { image: `/api/v1/client-images/${id}`, published: index === 0 },
    ]);
  }
  await database.pool.query(
    "UPDATE offers SET content = content || $1::jsonb WHERE slug = 'creation-de-marque'",
    [
      {
        image: `/api/v1/offer-images/${shared}`,
        alt: 'Image partagée de test',
      },
    ],
  );
  const offers = (
    await database.pool.query('SELECT * FROM offers ORDER BY slug')
  ).rows;
  await database.migrate();
  expect((await database.pool.query('SELECT * FROM clients')).rows).toEqual([]);
  expect((await database.pool.query('SELECT id FROM images')).rows).toEqual([
    { id: shared },
  ]);
  expect(
    (await database.pool.query('SELECT storage_key FROM media_deletions')).rows,
  ).toEqual([{ storage_key: `media/${orphan}` }]);
  expect(
    (await database.pool.query('SELECT * FROM offers ORDER BY slug')).rows,
  ).toEqual(offers);
  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
  expect((await database.pool.query('SELECT * FROM clients')).rows).toEqual([]);
  expect((await database.pool.query('SELECT id FROM images')).rows).toEqual([
    { id: shared },
  ]);
});

it('ne publie plus les API des anciennes fiches, même avec une autorisation valide', async () => {
  const secret = 'secret-de-test-de-plus-de-trente-deux-caracteres';
  vi.stubEnv('SESSION_SECRET', secret);
  const authorization = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
  const api = composeApi(database);
  for (const headers of [{}, { authorization }]) {
    for (const path of [
      '/v1/clients',
      '/v1/admin/clients',
      '/v1/client-images/00000000-0000-4000-8000-000000000001',
    ]) {
      expect((await api.request(path, { headers })).status).toBe(404);
    }
    expect(
      (
        await api.request('/v1/admin/clients/maison-sauge', {
          method: 'POST',
          headers,
        })
      ).status,
    ).toBe(404);
  }
});
