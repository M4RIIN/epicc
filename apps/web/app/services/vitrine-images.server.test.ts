import { afterEach, expect, it, vi } from 'vitest';
import { loadVitrineImages } from './vitrine-images.server';

afterEach(() => vi.unstubAllGlobals());
it('refuse un catalogue incomplet sans remplacer les visuels par des fichiers du frontend', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([])));
  await expect(loadVitrineImages()).rejects.toMatchObject({ status: 503 });
});
it('conserve une erreur du stockage sans repli local', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
  );
  await expect(loadVitrineImages()).rejects.toMatchObject({ status: 503 });
});
