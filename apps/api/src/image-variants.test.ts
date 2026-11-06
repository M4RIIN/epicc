import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { Database } from './database';
import { composeApi } from './composition-root';
import type { ObjectStorage } from './object-storage';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

const secret = 'secret-de-test-images-avec-plus-de-trente-deux-caracteres';
const authorization = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
const objects = new Map<string, Uint8Array>();
const storage: ObjectStorage = {
  put: vi.fn(async (key, bytes) => {
    objects.set(key, bytes);
  }),
  get: vi.fn(async (key) => {
    const content = objects.get(key);
    if (!content) throw new Error('Absent');
    return content;
  }),
  delete: vi.fn(async (key) => {
    objects.delete(key);
  }),
};
let name: string;
let database: Database;
let png: Buffer;
beforeEach(async () => {
  vi.stubEnv('SESSION_SECRET', secret);
  name = testDatabaseName('variants');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name), storage);
  await database.migrate({ provisionAdmin: false });
  png = await sharp({
    create: {
      width: 1280,
      height: 960,
      channels: 4,
      background: { r: 200, g: 40, b: 80, alpha: 0.4 },
    },
  })
    .png()
    .toBuffer();
});
afterEach(async () => {
  await database?.close();
  if (name) await manageTestDatabase(name, false);
  objects.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
async function upload(bytes = png, remove = false) {
  const form = new FormData();
  form.set('alt', 'Illustration de test');
  if (remove) form.set('removeImage', 'yes');
  else
    form.set(
      'image',
      new File([new Uint8Array(bytes)], 'test.png', { type: 'image/png' }),
    );
  expect(
    (
      await composeApi(database).request(
        '/v1/admin/offers/creation-de-marque',
        { method: 'POST', headers: { authorization }, body: form },
      )
    ).status,
  ).toBe(200);
  const result = await database.pool.query(
    "SELECT content FROM offers WHERE slug='creation-de-marque'",
  );
  return result.rows[0].content.image as string | null;
}
function request(url: string, headers?: HeadersInit) {
  return composeApi(database).request(
    url.replace('/api', ''),
    headers ? { headers } : {},
  );
}

it('compresse une seule fois, préserve transparence et original, et réutilise le cache après redémarrage sans lire S3', async () => {
  const original = (await upload())!;
  const optimized = `${original}?w=640&v=1`;
  vi.mocked(storage.get).mockClear();
  const responses = await Promise.all([
    request(optimized),
    request(optimized),
    request(optimized),
  ]);
  expect(responses.every((response) => response.status === 200)).toBe(true);
  expect(storage.get).toHaveBeenCalledTimes(1);
  const response = responses[0]!;
  expect(response.headers.get('Content-Type')).toBe('image/webp');
  expect(response.headers.get('Cache-Control')).toBe(
    'public, max-age=31536000, immutable',
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  expect(await sharp(bytes).metadata()).toMatchObject({
    width: 640,
    height: 480,
    hasAlpha: true,
  });
  expect(bytes.length).toBeLessThan(png.length);
  expect(Buffer.from(await (await request(original)).arrayBuffer())).toEqual(
    png,
  );
  const etag = response.headers.get('ETag')!;
  await database.close();
  database = new Database(testDatabaseUrl(name), storage);
  await database.migrate({ provisionAdmin: false });
  vi.mocked(storage.get).mockClear();
  expect((await request(optimized, { 'If-None-Match': etag })).status).toBe(
    304,
  );
  expect(Buffer.from(await (await request(optimized)).arrayBuffer())).toEqual(
    bytes,
  );
  expect(storage.get).not.toHaveBeenCalled();
  expect(
    (await database.pool.query('SELECT * FROM image_variants')).rowCount,
  ).toBe(1);
});

it('borne les conversions, garde les petites images à leur résolution native et invalide les anciens identifiants', async () => {
  const small = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#abc' },
  })
    .png()
    .toBuffer();
  const original = (await upload(small))!;
  const offers = await (
    await composeApi(database).request('/v1/offers')
  ).json();
  expect(offers[0].sources).toEqual([
    { src: `${original}?w=320&v=1`, width: 2 },
  ]);
  const optimized = `${original}?w=320&v=1`;
  expect(
    await sharp(
      Buffer.from(await (await request(optimized)).arrayBuffer()),
    ).metadata(),
  ).toMatchObject({ width: 2, height: 2 });
  for (const query of [
    '?w=0&v=1',
    '?w=99999&v=1',
    '?w=640&v=2',
    '?w=640',
    '?v=1',
  ]) {
    const response = await request(`${original}${query}`);
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  }
  const replacement = await upload();
  expect(replacement).not.toBe(original);
  expect((await request(optimized)).status).toBe(404);
  expect(
    (await database.pool.query('SELECT * FROM image_variants')).rowCount,
  ).toBe(0);
  await upload(png, true);
  expect((await request(`${replacement}?w=640&v=1`)).status).toBe(404);
});

it('vérifie les références publiques avant le cache et reprend après une erreur de stockage', async () => {
  const id = randomUUID();
  await database.images.write(
    id,
    { mime: 'image/png', content: png, width: 1280, height: 960 },
    async (connection) => {
      await connection.query(
        'UPDATE clients SET content = content || $2::jsonb WHERE slug=$1',
        [
          'maison-sauge',
          { published: false, image: `/api/v1/client-images/${id}` },
        ],
      );
    },
  );
  for (const kind of ['offer', 'project']) {
    expect(
      (await request(`/api/v1/${kind}-images/${id}?w=640&v=1`)).status,
    ).toBe(404);
  }
  expect(
    (await database.pool.query('SELECT * FROM image_variants')).rowCount,
  ).toBe(0);
  const original = (await upload())!;
  vi.mocked(storage.get).mockRejectedValueOnce(new Error('Indisponible'));
  const failure = await request(`${original}?w=640&v=1`);
  expect(failure.status).toBe(503);
  expect(failure.headers.get('Cache-Control')).toBe('no-store');
  expect((await request(`${original}?w=640&v=1`)).status).toBe(200);
  expect(Buffer.from(await (await request(original)).arrayBuffer())).toEqual(
    png,
  );
});
