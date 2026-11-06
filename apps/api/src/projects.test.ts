import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { projectImageSchema } from '@epicc/content-contracts';
import { Database } from './database';
import { createProjectsApi } from './projects.api';
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
  await database.images.write(null, undefined, async (connection) => {
    await connection.query('DELETE FROM clients');
  });
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

it('ajoute plusieurs photos par client, valide les tailles et permet de les modifier puis supprimer', async () => {
  let api = createProjectsApi(database);
  const post = (target: string, form: FormData) =>
    api.request(`/v1/admin/project-images/${target}`, {
      method: 'POST',
      body: form,
      headers: { authorization },
    });
  const form = new FormData();
  form.set('project', 'Deux Mnu');
  form.set('alt', 'Photo de test');
  form.set('size', 'medium');
  expect((await post('nouvelle', form)).status).toBe(400);
  form.set('image', new File([png], 'photo.png', { type: 'image/png' }));
  form.set('size', '999');
  expect((await post('nouvelle', form)).status).toBe(400);
  form.set('size', 'small');
  for (let count = 0; count < 4; count++)
    expect((await post('nouvelle', form)).status).toBe(200);
  const images = projectImageSchema
    .array()
    .parse(await (await api.request('/v1/project-images')).json());
  const additions = images.filter((item) => item.file.startsWith('photo-'));
  expect(additions).toHaveLength(4);
  expect(
    additions.every(
      (item) =>
        item.project === 'Deux Mnu' &&
        item.width === 2 &&
        item.height === 2 &&
        item.size === 'small',
    ),
  ).toBe(true);
  const photo = additions[0]!;
  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate({ provisionAdmin: false });
  api = createProjectsApi(database);
  expect(await (await api.request('/v1/project-images')).json()).toContainEqual(
    photo,
  );
  form.delete('image');
  form.set('size', 'large');
  // Le client propriétaire ne peut pas être changé par une édition.
  form.set('project', 'Annafurna');
  expect((await post(photo.file, form)).status).toBe(200);
  const updated = await (await api.request('/v1/project-images')).json();
  expect(updated).toContainEqual({ ...photo, size: 'large' });
  expect((await api.request(photo.image!.replace('/api', ''))).status).toBe(
    200,
  );
  form.set('intent', 'delete');
  expect((await post(photo.file, form)).status).toBe(200);
  expect((await api.request(photo.image!.replace('/api', ''))).status).toBe(
    404,
  );
  expect((await post(file, form)).status).toBe(400);
});

it('gère un seul logo pour les deux apparitions de L’Écluse Douze', async () => {
  const api = createProjectsApi(database);
  const form = new FormData();
  form.set('alt', 'Logo de test');
  form.set('image', new File([png], 'logo.png', { type: 'image/png' }));
  expect(
    (
      await api.request(
        '/v1/admin/project-images/CaptureDecran20261029A153342111.png',
        {
          method: 'POST',
          body: form,
          headers: { authorization },
        },
      )
    ).status,
  ).toBe(200);
  const images = projectImageSchema
    .array()
    .parse(await (await api.request('/v1/project-images')).json());
  const logos = images.filter((item) => item.project === 'L’Écluse Douze');
  expect(logos).toHaveLength(2);
  expect(logos[0]!.image).toBe(logos[1]!.image);
  expect(logos[0]!.alt).toBe(logos[1]!.alt);
  expect(images.find((item) => item.project === 'Deux Mnu')!.image).toBeNull();
});
