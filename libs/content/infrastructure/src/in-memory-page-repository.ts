import type { PageRepository } from '@epicc/content-application';
import type { Page } from '@epicc/content-domain';

export class InMemoryPageRepository implements PageRepository {
  private readonly pages: ReadonlyMap<string, Page>;

  constructor(pages: readonly Page[]) {
    this.pages = new Map(pages.map((page) => [page.slug, page]));
  }

  async findBySlug(slug: string): Promise<Page | null> {
    return this.pages.get(slug) ?? null;
  }
}
