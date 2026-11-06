import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import sharp from 'sharp';
import { Database } from './database';
import type { ObjectStorage } from './object-storage';
import { composeApi } from './composition-root';
import { purgeLegacy } from './migrate-images';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

let database: Database;
let name: string;
let png: Buffer;
const objects = new Map<string, Uint8Array>();
const storage: ObjectStorage = {
  put: vi.fn(async (key, bytes) => {
    objects.set(key, bytes);
  }),
  get: vi.fn(async (key) => {
    if (!objects.has(key)) throw new Error('Absent');
    return objects.get(key)!;
  }),
  delete: vi.fn(async (key) => {
    objects.delete(key);
  }),
};
const secret = 'secret-de-test-de-plus-de-trente-deux-caracteres';
const authorization = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
beforeEach(async () => {
  vi.stubEnv('SESSION_SECRET', secret);
  vi.stubEnv('ADMIN_EMAIL', 'test@questboard.test');
  vi.stubEnv('ADMIN_PASSWORD', 'testtest');
  name = testDatabaseName('s3');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name), storage);
  await database.migrate();
  png = await sharp({
    create: { width: 10, height: 5, channels: 3, background: '#abc' },
  })
    .png()
    .toBuffer();
});
afterEach(async () => {
  await database?.close();
  if (name) await manageTestDatabase(name, false);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  objects.clear();
});
function post(image = true, authorized = true, remove = false) {
  const form = new FormData();
  form.set('alt', 'Illustration de test');
  if (image)
    form.set(
      'image',
      new File([new Uint8Array(png)], 'test.png', { type: 'image/png' }),
    );
  if (remove) form.set('removeImage', 'yes');
  return composeApi(database).request('/v1/admin/offers/creation-de-marque', {
    method: 'POST',
    headers: authorized ? { authorization } : {},
    body: form,
  });
}
it('stocke seulement référence et métadonnées, relit après redémarrage, remplace et supprime', async () => {
  expect((await post(true, false)).status).toBe(401);
  expect(objects.size).toBe(0);
  expect((await post()).status).toBe(200);
  const row = (await database.pool.query('SELECT * FROM images')).rows[0];
  expect(row).toMatchObject({
    content: null,
    mime: 'image/png',
    width: 10,
    height: 5,
    byte_size: String(png.length),
  });
  expect(objects.size).toBe(1);
  await database.close();
  database = new Database(testDatabaseUrl(name), storage);
  await database.migrate();
  const url = `/v1/offer-images/${row.id}`;
  const response = await composeApi(database).request(url);
  expect(response.status).toBe(200);
  expect(Buffer.from(await response.arrayBuffer())).toEqual(png);
  expect(response.headers.get('Cache-Control')).toContain('must-revalidate');
  expect(
    (
      await composeApi(database).request(url, {
        headers: { 'If-None-Match': response.headers.get('ETag')! },
      })
    ).status,
  ).toBe(304);
  expect((await post()).status).toBe(200);
  expect(objects.has(row.storage_key)).toBe(false);
  expect(objects.size).toBe(1);
  expect((await composeApi(database).request(url)).status).toBe(404);
  expect((await post(false, true, true)).status).toBe(200);
  expect(objects.size).toBe(0);
});
it('conserve le contenu précédent après un échec du PUT et reprend les suppressions en échec', async () => {
  await post();
  const original = (
    await database.pool.query('SELECT content FROM offers WHERE slug=$1', [
      'creation-de-marque',
    ])
  ).rows[0].content;
  vi.mocked(storage.put).mockRejectedValueOnce(
    new Error('secret à ne pas exposer'),
  );
  const failure = await post();
  expect(failure.status).toBe(503);
  expect(await failure.text()).not.toContain('secret');
  expect(
    (
      await database.pool.query('SELECT content FROM offers WHERE slug=$1', [
        'creation-de-marque',
      ])
    ).rows[0].content,
  ).toEqual(original);
  vi.mocked(storage.delete).mockRejectedValueOnce(new Error('Indisponible'));
  expect((await post(false, true, true)).status).toBe(200);
  expect(objects.size).toBe(1);
  expect(
    (await database.pool.query('SELECT * FROM media_deletions')).rows,
  ).toHaveLength(1);
  await database.images.cleanup();
  expect(objects.size).toBe(0);
});
it('nettoie les objets après rollback et les réservations abandonnées après un arrêt brutal', async () => {
  const image = { mime: 'image/png', content: png };
  await expect(
    database.images.write(randomUUID(), image, async () => {
      throw new Error('Rollback');
    }),
  ).rejects.toThrow('Rollback');
  expect(objects.size).toBe(0);
  expect((await database.pool.query('SELECT * FROM images')).rows).toHaveLength(
    0,
  );
  objects.set('media/abandon', png);
  await database.pool.query(
    "INSERT INTO media_deletions VALUES ('media/abandon', now() - interval '2 hours')",
  );
  await database.images.cleanup();
  expect(objects.size).toBe(0);
});
it('migre sans doublon et sans changer les URL, conserve puis purge les octets uniquement après vérification', async () => {
  const id = randomUUID();
  await database.pool.query(
    'INSERT INTO images (id,mime,content) VALUES ($1,$2,$3)',
    [id, 'image/png', png],
  );
  const url = `/api/v1/offer-images/${id}`;
  await database.pool.query(
    "UPDATE offers SET content=jsonb_set(content,'{image}',to_jsonb($1::text)) WHERE slug='creation-de-marque'",
    [url],
  );
  await database.images.migrateLegacy();
  await database.images.migrateLegacy();
  expect(objects.size).toBe(1);
  const row = (await database.pool.query('SELECT * FROM images')).rows[0];
  expect(row.content).toEqual(png);
  expect(
    (await composeApi(database).request(url.replace('/api', ''))).status,
  ).toBe(200);
  objects.set(row.storage_key, new Uint8Array([0]));
  await expect(purgeLegacy(database)).rejects.toThrow('non conforme');
  expect(
    (await database.pool.query('SELECT content FROM images')).rows[0].content,
  ).toEqual(png);
  objects.set(row.storage_key, png);
  await purgeLegacy(database);
  expect(
    (await database.pool.query('SELECT content FROM images')).rows[0].content,
  ).toBeNull();
});
it('protège les images des brouillons et les lectures administrateur', async () => {
  const client = (
    await database.pool.query('SELECT content FROM clients LIMIT 1')
  ).rows[0].content;
  const id = randomUUID();
  await database.images.write(
    id,
    { mime: 'image/png', content: png },
    async (connection) => {
      await connection.query('UPDATE clients SET content=$2 WHERE slug=$1', [
        client.slug,
        { ...client, published: false, image: `/api/v1/client-images/${id}` },
      ]);
    },
  );
  const api = composeApi(database);
  expect((await api.request(`/v1/client-images/${id}`)).status).toBe(404);
  expect((await api.request(`/v1/admin/images/${id}`)).status).toBe(401);
  const response = await api.request(`/v1/admin/images/${id}`, {
    headers: { authorization },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});

it('refuse de réintroduire une référence supprimée par un remplacement concurrent', async () => {
  await post();
  const old = (await database.pool.query('SELECT id FROM images')).rows[0].id;
  await post();
  await expect(
    database.images.write(null, undefined, async (connection) => {
      // Reproduit l’enregistrement d’un formulaire chargé avant le remplacement.
      const { assertImageReference } = await import('./images.store');
      await assertImageReference(connection, `/api/v1/offer-images/${old}`);
    }),
  ).rejects.toThrow('Rechargez');
  expect(objects.size).toBe(1);
});

it('reprend une copie historique non validée sans perdre la source ni dupliquer l’objet', async () => {
  const id = randomUUID();
  await database.pool.query(
    'INSERT INTO images (id,mime,content) VALUES ($1,$2,$3)',
    [id, 'image/png', png],
  );
  vi.mocked(storage.get).mockResolvedValueOnce(new Uint8Array([0]));
  await expect(database.images.migrateLegacy()).rejects.toThrow('vérification');
  expect(
    (
      await database.pool.query(
        'SELECT content, storage_key FROM images WHERE id=$1',
        [id],
      )
    ).rows[0],
  ).toEqual({ content: png, storage_key: null });
  await database.images.migrateLegacy();
  expect(objects.size).toBe(1);
  expect(
    (
      await database.pool.query('SELECT storage_key FROM images WHERE id=$1', [
        id,
      ])
    ).rows[0].storage_key,
  ).toBe(`media/${id}`);
  expect(
    (await database.pool.query('SELECT * FROM media_deletions')).rows,
  ).toHaveLength(0);
});
