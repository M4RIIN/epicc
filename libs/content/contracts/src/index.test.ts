import { describe, expect, it } from 'vitest';
import { publishedPageSchema } from './index';

describe('Contrat de page publique', () => {
  it('refuse une réponse partielle ou un contenu vide', () => {
    expect(
      publishedPageSchema.safeParse({ slug: 'accueil', title: '' }).success,
    ).toBe(false);
  });
  it('retire les propriétés internes à la frontière HTTP', () => {
    const page = publishedPageSchema.parse({
      slug: 'accueil',
      title: 'Accueil',
      description: 'Description',
      body: 'Contenu',
      published: true,
    });
    expect(page).not.toHaveProperty('published');
  });
});
