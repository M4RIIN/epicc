import { z } from 'zod';

export const publishedPageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string().min(1),
});

export type PublishedPage = z.infer<typeof publishedPageSchema>;

const text = z.string().trim().min(1, 'Ce champ est obligatoire.');
export const clientSchema = z.object({
  slug: text
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Utilisez des minuscules, chiffres et tirets.',
    ),
  number: text.max(10),
  name: text.max(150),
  sector: text.max(100),
  place: text.max(150),
  year: z.string().regex(/^\d{4}$/, 'Indiquez une année sur quatre chiffres.'),
  image: z
    .string()
    .regex(
      /^\/(?:images\/(?:botanique|atelier|cafe)\.jpg|api\/v1\/client-images\/[a-f0-9-]+)$/,
    ),
  alt: text.max(300),
  tagline: text.max(300),
  description: text.max(2000),
  need: text.max(3000),
  work: text.max(1500),
  note: text.max(2000),
  signature: text.max(200),
  color: z.enum(['sage', 'peach', 'yellow']),
  published: z.boolean(),
  position: z.number().int().min(0).max(99999),
});
export type Client = z.infer<typeof clientSchema>;
