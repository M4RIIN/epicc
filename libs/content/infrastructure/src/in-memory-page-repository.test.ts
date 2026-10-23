import { describe, expect, it } from 'vitest';
import { Page } from '@epicc/content-domain';
import { InMemoryPageRepository } from './in-memory-page-repository';

describe('InMemoryPageRepository', () => {
  it('retrouve une page par son slug et retourne null pour une page absente', async () => {
    const page = new Page({
      slug: 'accueil',
      title: 'Accueil',
      description: 'Description',
      body: 'Contenu',
      published: true,
    });
    const repository = new InMemoryPageRepository([page]);
    await expect(repository.findBySlug('accueil')).resolves.toBe(page);
    await expect(repository.findBySlug('absente')).resolves.toBeNull();
  });
});
