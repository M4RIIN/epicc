import { describe, expect, it } from 'vitest';
import { Page } from '@epicc/content-domain';
import { GetPublishedPage, PageNotFoundError } from './get-published-page';
import type { PageRepository } from './page-repository';

function repositoryReturning(page: Page | null): PageRepository {
  return { findBySlug: async () => page };
}

const properties = {
  slug: 'accueil',
  title: 'Accueil',
  description: 'Description',
  body: 'Contenu',
  published: true,
};

describe('GetPublishedPage', () => {
  it('retourne une page publiée en utilisant le slug demandé', async () => {
    const page = new Page(properties);
    const repository: PageRepository = {
      findBySlug: async (slug) => (slug === page.slug ? page : null),
    };
    await expect(
      new GetPublishedPage(repository).execute('accueil'),
    ).resolves.toBe(page);
  });
  it('refuse une page absente', async () => {
    await expect(
      new GetPublishedPage(repositoryReturning(null)).execute('absente'),
    ).rejects.toThrow(PageNotFoundError);
  });
  it('ne divulgue pas un brouillon', async () => {
    const page = new Page({ ...properties, published: false });
    await expect(
      new GetPublishedPage(repositoryReturning(page)).execute('accueil'),
    ).rejects.toThrow(PageNotFoundError);
  });
});
