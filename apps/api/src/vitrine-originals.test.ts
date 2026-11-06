import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { vitrineAssetFiles } from '@epicc/content-contracts';
import { Database } from './database';
import { importVitrineOriginals } from './vitrine-originals';
import { createVitrineApi } from './vitrine.api';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

let database: Database;
let name: string;
const objects = new Map<string, Uint8Array>();
const storage = {
  put: vi.fn(async (key: string, content: Uint8Array) => {
    objects.set(key, content);
  }),
  get: vi.fn(async (key: string) => {
    const content = objects.get(key);
    if (!content) throw new Error('Absent');
    return content;
  }),
  delete: vi.fn(async (key: string) => {
    objects.delete(key);
  }),
};
beforeEach(async () => {
  name = testDatabaseName('vitrine');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name), storage);
  await database.migrate({ provisionAdmin: false });
});
afterEach(async () => {
  await database?.close();
  if (name) await manageTestDatabase(name, false);
  objects.clear();
  vi.restoreAllMocks();
});
it('importe les visuels fixes sans modifier les octets, les conserve et les relit du stockage après redémarrage', async () => {
  expect(
    await importVitrineOriginals(database, 'apps/web/public/images'),
  ).toEqual({ imported: vitrineAssetFiles.length, skipped: 0 });
  const before = (
    await database.pool.query('SELECT * FROM vitrine_originals ORDER BY file')
  ).rows;
  expect(await importVitrineOriginals(database, '/dossier-absent')).toEqual({
    imported: 0,
    skipped: vitrineAssetFiles.length,
  });
  await database.images.write(null, undefined, async () => undefined);
  expect(objects.size).toBe(vitrineAssetFiles.length);
  await database.close();
  database = new Database(testDatabaseUrl(name), storage);
  await database.migrate({ provisionAdmin: false });
  expect(
    (await database.pool.query('SELECT * FROM vitrine_originals ORDER BY file'))
      .rows,
  ).toEqual(before);
  const api = createVitrineApi(database);
  const assets = await (await api.request('/v1/vitrine-images')).json();
  expect(assets).toHaveLength(vitrineAssetFiles.length);
  const hero = assets.find(
    (item: { file: string }) => item.file === 'Image29102026A17281.png',
  );
  const original = await api.request(hero.image.replace('/api', ''));
  const expected = await readFile(
    'apps/web/public/images/vitrine/Image29102026A17281.png',
  );
  const hash = (bytes: Uint8Array) =>
    createHash('sha256').update(bytes).digest('hex');
  expect(hash(new Uint8Array(await original.arrayBuffer()))).toBe(
    hash(expected),
  );
  expect(storage.get).toHaveBeenCalled();
  expect(
    (await api.request(hero.sources[0].src.replace('/api', ''))).headers.get(
      'Content-Type',
    ),
  ).toBe('image/webp');
  const stamp = assets.find(
    (item: { file: string }) => item.file === 'Group16.svg',
  );
  expect(stamp.sources).toBeUndefined();
  expect(
    (await api.request(stamp.image.replace('/api', ''))).headers.get(
      'Content-Type',
    ),
  ).toBe('image/svg+xml');
  expect(
    (await api.request(`${stamp.image.replace('/api', '')}?w=320&v=1`)).status,
  ).toBe(400);
  expect(
    (
      await api.request(
        '/v1/vitrine-images/00000000-0000-0000-0000-000000000066',
      )
    ).status,
  ).toBe(404);
});
