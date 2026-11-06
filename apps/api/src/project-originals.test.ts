import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { vitrineProjects } from '@epicc/content-contracts';
import { Database } from './database';
import { importProjectOriginals } from './project-originals';
import { createProjectsApi } from './projects.api';
import { ClientStore } from './clients.store';
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
const root = 'apps/web/public/images/vitrine';
beforeEach(async () => {
  name = testDatabaseName('originals');
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
it('importe les 26 visuels sans changer leurs octets, conserve leurs métadonnées et reprend sans doublon', async () => {
  await importProjectOriginals(database, root);
  expect(objects.size).toBe(26);
  await importProjectOriginals(database, root);
  expect(objects.size).toBe(26);
  const rows = await database.pool.query('SELECT * FROM images');
  expect(rows.rowCount).toBe(26);
  expect(
    rows.rows.every(
      (row) =>
        !row.content &&
        row.storage_key &&
        row.sha256 &&
        row.width &&
        row.height &&
        Number(row.byte_size) > 0,
    ),
  ).toBe(true);
  const api = createProjectsApi(database);
  const images = await (await api.request('/v1/project-images')).json();
  for (const piece of vitrineProjects.flatMap((item) => item.pieces)) {
    const image = images.find(
      (item: { file: string }) => item.file === piece.file,
    );
    expect(image.image).toMatch(/^\/api\/v1\/project-images\//);
    const response = await api.request(image.image.replace('/api', ''));
    const hash = (bytes: Uint8Array) =>
      createHash('sha256').update(bytes).digest('hex');
    expect(hash(new Uint8Array(await response.arrayBuffer()))).toBe(
      hash(await readFile(`${root}/projets-${piece.file}`)),
    );
  }
  // Une autre édition ne doit jamais nettoyer les originaux, nécessaires à la restauration.
  await new ClientStore(database).delete('maison-sauge');
  expect(objects.size).toBe(26);
}, 60000);
it('conserve la source et ne publie pas une copie S3 non conforme', async () => {
  storage.get.mockResolvedValueOnce(new Uint8Array([0]));
  await expect(importProjectOriginals(database, root)).rejects.toThrow(
    'non conforme',
  );
  expect(
    (await database.pool.query('SELECT * FROM project_originals')).rowCount,
  ).toBe(0);
  expect((await database.pool.query('SELECT * FROM images')).rowCount).toBe(0);
  expect(objects.size).toBe(0);
  await importProjectOriginals(database, root);
  expect(objects.size).toBe(26);
}, 60000);
