import { z } from 'zod';

export const publishedPageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string().min(1),
});

export type PublishedPage = z.infer<typeof publishedPageSchema>;
