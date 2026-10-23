import { describe, expect, it } from 'vitest';
import { InvalidPageError, Page } from './page';

const properties = {
  slug: 'accueil',
  title: 'Accueil',
  description: 'Description',
  body: 'Contenu',
  published: true,
};

describe('Page', () => {
  it('normalise les textes et préserve ses invariants après création', () => {
    const page = new Page({ ...properties, title: '  Accueil  ' });
    expect(page.title).toBe('Accueil');
    expect(Object.isFrozen(page)).toBe(true);
  });

  it.each(['', 'Avec Majuscules', '../prive', 'deux--tirets'])(
    'refuse le slug invalide %s',
    (slug) => {
      expect(() => new Page({ ...properties, slug })).toThrow(InvalidPageError);
    },
  );

  it.each(['title', 'description', 'body'] as const)(
    'refuse un champ %s vide',
    (field) => {
      expect(() => new Page({ ...properties, [field]: '  ' })).toThrow(
        InvalidPageError,
      );
    },
  );
});
