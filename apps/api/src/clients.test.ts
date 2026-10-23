import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ClientStore } from './clients.store';
import { createClientsApi } from './clients.api';

const secret = 'un-secret-de-test-de-plus-de-trente-deux-caracteres';
const authorization = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
afterEach(() => vi.unstubAllEnvs());

describe('gestion persistante des clients', () => {
  it('conserve les modifications et une liste vide après réouverture', () => {
    const dir = mkdtempSync(join(tmpdir(), 'epicc-clients-'));
    const path = join(dir, 'clients.sqlite');
    let store = new ClientStore(path);
    try {
      const client = store.list(true)[0]!;
      store.write({
        ...client,
        name: 'Client modifié',
        position: 999,
        published: false,
      });
      store.close();
      store = new ClientStore(path);
      expect(store.list().some((c) => c.slug === client.slug)).toBe(false);
      expect(store.list(true).at(-1)?.name).toBe('Client modifié');
      for (const item of store.list(true)) store.delete(item.slug);
      store.close();
      store = new ClientStore(path);
      expect(store.list(true)).toEqual([]);
    } finally {
      store.close();
      rmSync(dir, { recursive: true });
    }
  });

  it('protège les lectures et écritures privées et refuse une configuration absente', async () => {
    const store = new ClientStore(':memory:');
    try {
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
      vi.stubEnv('ADMIN_PASSWORD', '');
      expect(
        (await api.request('/v1/admin/clients', { headers: { authorization } }))
          .status,
      ).toBe(401);
    } finally {
      store.close();
    }
  });

  it('valide les fiches, refuse les doublons et masque les images des brouillons', async () => {
    vi.stubEnv('SESSION_SECRET', secret);
    vi.stubEnv('ADMIN_PASSWORD', 'testtest');
    const store = new ClientStore(':memory:');
    try {
      const api = createClientsApi(store);
      const original = store.list(true)[0]!;
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
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7XcAAAAASUVORK5CYII=',
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
      const draft = store.list(true).find((c) => c.slug === original.slug)!;
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
      store.delete(original.slug);
      expect((await api.request(draft.image.replace('/api', ''))).status).toBe(
        404,
      );
    } finally {
      store.close();
    }
  });
});
