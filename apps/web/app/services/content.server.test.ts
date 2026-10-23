import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadHomePage } from './content.server';

const page = {
  slug: 'accueil',
  title: 'Accueil',
  description: 'Description',
  body: 'Contenu',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Chargement serveur du contenu', () => {
  it('valide le contrat de la réponse HTTP', async () => {
    const fetchPage = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(page));
    await expect(loadHomePage(fetchPage)).resolves.toEqual(page);
    expect(fetchPage.mock.calls[0]?.[0]?.toString()).toContain(
      '/api/v1/pages/accueil',
    );
  });
  it('conserve le statut 404', async () => {
    await expect(
      loadHomePage(async () => new Response(null, { status: 404 })),
    ).rejects.toMatchObject({ status: 404 });
  });
  it.each(['réseau', 'contrat', 'serveur'])(
    'retourne 503 en cas d’erreur %s',
    async (failure) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const fetchPage: typeof fetch = async () => {
        if (failure === 'réseau') throw new Error('Connexion refusée');
        return failure === 'contrat'
          ? Response.json({ title: 123 })
          : new Response(null, { status: 500 });
      };
      await expect(loadHomePage(fetchPage)).rejects.toMatchObject({
        status: 503,
      });
    },
  );
});
