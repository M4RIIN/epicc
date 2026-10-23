import type { Page } from '@epicc/content-domain';
import type { PageRepository } from './page-repository';

export class PageNotFoundError extends Error {
  constructor() {
    super('Cette page est introuvable.');
    this.name = 'PageNotFoundError';
  }
}

export class GetPublishedPage {
  constructor(private readonly pages: PageRepository) {}

  async execute(slug: string): Promise<Page> {
    const page = await this.pages.findBySlug(slug);
    if (!page?.published) {
      throw new PageNotFoundError();
    }
    return page;
  }
}
