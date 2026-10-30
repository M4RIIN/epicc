import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { ClientStore } from './clients.store';
import { createClientsApi } from './clients.api';
import { Database } from './database';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

const secret = 'un-secret-de-test-de-plus-de-trente-deux-caracteres';
const authorization = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
let database: Database;
let name: string;
beforeEach(async () => {
  name = testDatabaseName('clients');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await database?.close();
  if (name) await manageTestDatabase(name, false);
});

describe('gestion persistante des clients', () => {
  it('conserve les modifications et une liste vide après réouverture', async () => {
    let store = new ClientStore(database);
    const client = (await store.list(true))[0]!;
    await store.write({
      ...client,
      name: 'Client modifié',
      position: 999,
      published: false,
    });
    await database.close();
    database = new Database(testDatabaseUrl(name));
    await database.migrate();
    store = new ClientStore(database);
    expect((await store.list()).some((c) => c.slug === client.slug)).toBe(
      false,
    );
    expect((await store.list(true)).at(-1)?.name).toBe('Client modifié');
    for (const item of await store.list(true)) await store.delete(item.slug);
    await database.migrate();
    expect(await store.list(true)).toEqual([]);
  });

  it('protège les lectures et écritures privées et refuse une configuration absente', async () => {
    const store = new ClientStore(database);
    {
      const api = createClientsApi(store);
      expect((await api.request('/v1/admin/clients')).status).toBe(401);
      expect(
        (
          await api.request('/v1/admin/clients/maison-sauge', {
            method: 'POST',
          })
        ).status,
      ).toBe(401);
      vi.stubEnv('SESSION_SECRET', secret);
      vi.stubEnv('ADMIN_PASSWORD', 'testtest');
      expect(
        (await api.request('/v1/admin/clients', { headers: { authorization } }))
          .status,
      ).toBe(200);
      vi.stubEnv('SESSION_SECRET', '');
      expect(
        (await api.request('/v1/admin/clients', { headers: { authorization } }))
          .status,
      ).toBe(401);
    }
  });

  it('valide les fiches, refuse les doublons et masque les images des brouillons', async () => {
    vi.stubEnv('SESSION_SECRET', secret);
    vi.stubEnv('ADMIN_PASSWORD', 'testtest');
    const store = new ClientStore(database);
    {
      const api = createClientsApi(store);
      const original = (await store.list(true))[0]!;
      const post = (client: unknown, intent = 'update', file?: File) => {
        const form = new FormData();
        form.set('client', JSON.stringify(client));
        form.set('intent', intent);
        if (file) form.set('image', file);
        return api.request(`/v1/admin/clients/${original.slug}`, {
          method: 'POST',
          headers: { authorization },
          body: form,
        });
      };
      expect((await post({ ...original, name: '' })).status).toBe(400);
      expect((await post(original, 'create')).status).toBe(409);
      expect(
        (
          await post(
            original,
            'update',
            new File(['<svg/>'], 'photo.png', { type: 'image/png' }),
          )
        ).status,
      ).toBe(400);
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
        'base64',
      );
      expect(
        (
          await post(
            { ...original, published: false },
            'update',
            new File([png], 'photo.png', { type: 'image/png' }),
          )
        ).status,
      ).toBe(200);
      const draft = (await store.list(true)).find(
        (c) => c.slug === original.slug,
      )!;
      expect((await api.request(draft.image.replace('/api', ''))).status).toBe(
        404,
      );
      expect(
        (
          await api.request(
            draft.image.replace('/api/v1/client-images', '/v1/admin/images'),
            { headers: { authorization } },
          )
        ).status,
      ).toBe(200);
      expect((await post({ ...draft, published: true })).status).toBe(200);
      const image = await api.request(draft.image.replace('/api', ''));
      expect(image.headers.get('content-type')).toBe('image/png');
      expect(Buffer.from(await image.arrayBuffer())).toEqual(png);
      await store.delete(original.slug);
      expect((await api.request(draft.image.replace('/api', ''))).status).toBe(
        404,
      );
    }
  });
});

it('conserve la galerie après redémarrage, protège les brouillons et refuse les images d’un autre projet', async () => {
  vi.stubEnv('SESSION_SECRET', secret);
  let store = new ClientStore(database);
  let api = createClientsApi(store);
  const original = (await store.list(true))[0]!;
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYvnvF8t0rGCAUADkiCCmOz4EsAAAAAElFTkSuQmCC',
    'base64',
  );
  const post = (
    client: typeof original,
    addPhoto = false,
    alt = 'Détail de test',
  ) => {
    const form = new FormData();
    form.set('client', JSON.stringify(client));
    if (addPhoto)
      form.set(
        'galleryImage',
        new File([png], 'detail.png', { type: 'image/png' }),
      );
    form.set('galleryAlt', alt);
    return api.request(`/v1/admin/clients/${client.slug}`, {
      method: 'POST',
      headers: { authorization },
      body: form,
    });
  };
  expect((await post(original, true, '')).status).toBe(400);
  expect((await post({ ...original, published: false }, true)).status).toBe(
    200,
  );
  await database.close();
  database = new Database(testDatabaseUrl(name));
  await database.migrate();
  store = new ClientStore(database);
  api = createClientsApi(store);
  const draft = (await store.list(true)).find(
    (client) => client.slug === original.slug,
  )!;
  expect(draft.gallery).toHaveLength(1);
  const image = draft.gallery[0]!.image.replace('/api', '');
  expect((await api.request(image)).status).toBe(404);
  expect(
    (
      await api.request(
        image.replace('/v1/client-images/', '/v1/admin/images/'),
        { headers: { authorization } },
      )
    ).status,
  ).toBe(200);
  const other = (await store.list(true)).find(
    (client) => client.slug !== original.slug,
  )!;
  expect((await post({ ...other, gallery: draft.gallery })).status).toBe(400);
  expect((await post({ ...draft, published: true })).status).toBe(200);
  expect(Buffer.from(await (await api.request(image)).arrayBuffer())).toEqual(
    png,
  );
  expect((await post({ ...draft, gallery: [] })).status).toBe(200);
  expect((await api.request(image)).status).toBe(404);
  expect(
    (await database.pool.query('SELECT count(*) FROM images')).rows[0].count,
  ).toBe('0');
});

it('réordonne tous les projets dans une transaction et refuse une liste incomplète ou dupliquée', async () => {
  vi.stubEnv('SESSION_SECRET', secret);
  const store = new ClientStore(database);
  const api = createClientsApi(store);
  const slugs = (await store.list(true)).map((client) => client.slug);
  expect(await store.reorder(slugs.slice(1))).toBe(false);
  expect(await store.reorder(slugs.map(() => slugs[0]!))).toBe(false);
  expect((await store.list(true)).map((client) => client.slug)).toEqual(slugs);
  const reversed = [...slugs].reverse();
  const form = new FormData();
  form.set('slugs', JSON.stringify(reversed));
  expect(
    (
      await api.request('/v1/admin/clients-order', {
        method: 'POST',
        body: form,
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await api.request('/v1/admin/clients-order', {
        method: 'POST',
        body: form,
        headers: { authorization },
      })
    ).status,
  ).toBe(200);
  expect((await store.list(true)).map((client) => client.slug)).toEqual(
    reversed,
  );
  expect((await store.list(true)).map((client) => client.position)).toEqual([
    0, 1, 2, 3, 4, 5,
  ]);
});
