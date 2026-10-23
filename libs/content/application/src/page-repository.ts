import type { Page } from '@epicc/content-domain';

export interface PageRepository {
  findBySlug(slug: string): Promise<Page | null>;
}
