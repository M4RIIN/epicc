import { describe, expect, it, vi } from 'vitest';
import { Page } from '@epicc/content-domain';
import { InMemoryPageRepository } from '@epicc/content-infrastructure';
import { createApi } from './app';

const properties = {
  slug: 'accueil',
  title: 'Accueil',
  description: 'Description',
  body: 'Contenu',
  published: true,
};
const api = createApi(
  new InMemoryPageRepository([
    new Page(properties),
    new Page({ ...properties, slug: 'brouillon', published: false }),
  ]),
);

describe('API publique', () => {
  it('expose seulement les champs publics d’une page publiée', async () => {
    const response = await api.request('/v1/pages/accueil');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      slug: 'accueil',
      title: 'Accueil',
      description: 'Description',
      body: 'Contenu',
    });
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
  it.each(['absente', 'brouillon'])(
    'retourne 404 pour la page %s',
    async (slug) => {
      const response = await api.request(`/v1/pages/${slug}`);
      expect(response.status).toBe(404);
    },
  );
  it('ne divulgue pas les erreurs internes', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const failingApi = createApi({
        findBySlug: async () => {
          throw new Error('Détail interne confidentiel');
        },
      });
      const response = await failingApi.request('/v1/pages/accueil');
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain('confidentiel');
    } finally {
      log.mockRestore();
    }
  });
  it('ne propose aucune écriture publique', async () => {
    const response = await api.request('/v1/pages/accueil', {
      method: 'PUT',
      body: '{}',
    });
    expect(response.status).toBe(404);
  });
});
