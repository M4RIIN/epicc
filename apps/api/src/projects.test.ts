import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { projectImageSchema } from '@epicc/content-contracts';
import { Database } from './database';
import { createProjectsApi } from './projects.api';
import { ClientStore } from './clients.store';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

const secret = 'secret-de-test-projets-avec-plus-de-trente-deux-caracteres';
const authorization = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
const file = 'Rectangle5.png';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
  'base64',
);
let database: Database;
let name: string;
beforeEach(async () => {
  name = testDatabaseName('projects');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name));
  await database.migrate({ provisionAdmin: false });
  vi.stubEnv('SESSION_SECRET', secret);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await database?.close();
  if (name) await manageTestDatabase(name, false);
});

it('protège et valide les remplacements sans accepter de nouveaux emplacements', async () => {
  const api = createProjectsApi(database);
  const post = (form: FormData, target = file, authenticated = true) =>
    api.request(`/v1/admin/project-images/${target}`, {
      method: 'POST',
      body: form,
      headers: authenticated ? { authorization } : {},
    });
  expect((await post(new FormData(), file, false)).status).toBe(401);
  expect((await post(new FormData(), 'inconnu.png')).status).toBe(404);
  const form = new FormData();
  form.set('alt', '');
  expect((await post(form)).status).toBe(400);
  form.set('alt', 'Image de test');
  form.set(
    'image',
    new File(['faux fichier'], 'test.png', { type: 'image/png' }),
  );
  expect((await post(form)).status).toBe(400);
  form.set(
    'image',
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'test.png', {
      type: 'image/png',
    }),
  );
  expect((await post(form)).status).toBe(400);
  expect((await database.pool.query('SELECT * FROM images')).rowCount).toBe(0);
});

it('persiste les images, les conserve lors des autres éditions et nettoie les remplacements et restaurations', async () => {
  let api = createProjectsApi(database);
  const originals = projectImageSchema
    .array()
    .parse(await (await api.request('/v1/project-images')).json());
  const form = new FormData();
  form.set('alt', 'Image de test du projet');
  form.set('image', new File([png], 'test.png', { type: 'image/png' }));
  const post = () =>
    api.request(`/v1/admin/project-images/${file}`, {
      method: 'POST',
      body: form,
      headers: { authorization },
    });
  expect((await post()).status).toBe(200);
  const first = (await (await api.request('/v1/project-images')).json()).find(
    (item: { file: string }) => item.file === file,
  );
  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate({ provisionAdmin: false });
  api = createProjectsApi(database);
  expect(await (await api.request('/v1/project-images')).json()).toContainEqual(
    first,
  );
  // Le nettoyage des fiches du répertoire doit conserver les images du collage.
  await new ClientStore(database).delete('maison-sauge');
  const image = await api.request(first.image.replace('/api', ''));
  expect(image.headers.get('Content-Type')).toBe('image/png');
  expect(Buffer.from(await image.arrayBuffer())).toEqual(png);
  form.delete('image');
  form.set('alt', 'Texte corrigé');
  expect((await post()).status).toBe(200);
  expect((await api.request(first.image.replace('/api', ''))).status).toBe(200);
  form.set('image', new File([png], 'autre.png', { type: 'image/png' }));
  expect((await post()).status).toBe(200);
  expect((await api.request(first.image.replace('/api', ''))).status).toBe(404);
  form.set('restore', 'yes');
  expect((await post()).status).toBe(200);
  expect(await (await api.request('/v1/project-images')).json()).toEqual(
    originals,
  );
  expect((await database.pool.query('SELECT * FROM images')).rowCount).toBe(0);
});
