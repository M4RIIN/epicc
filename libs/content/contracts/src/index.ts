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

const responsiveImageSourcesSchema = z.array(
  z.object({
    src: z
      .string()
      .regex(
        /^\/api\/v1\/(?:project|offer|vitrine)-images\/[a-f0-9-]+\?w=(?:320|640|1280|1920)&v=1$/,
      ),
    width: z.number().int().positive(),
  }),
);

export const offerSchema = z
  .object({
    slug: text.max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: text.max(150),
    description: text.max(3000),
    summary: z.string().trim().max(1500).optional(),
    image: z
      .string()
      .regex(/^\/api\/v1\/offer-images\/[a-f0-9-]+$/)
      .nullable(),
    alt: z.string().trim().max(300),
    hoverImage: z
      .string()
      .regex(/^\/api\/v1\/offer-images\/[a-f0-9-]+$/)
      .nullable()
      .optional(),
    hoverAlt: z.string().trim().max(300).optional(),
    hoverSources: responsiveImageSourcesSchema.optional(),
    position: z.number().int().min(0).max(99999),
    sources: responsiveImageSourcesSchema.optional(),
  })
  .refine((offer) => !offer.image || offer.alt.length > 0, {
    message: 'Décrivez l’image pour les lecteurs d’écran.',
    path: ['alt'],
  })
  .refine((offer) => !offer.hoverImage || Boolean(offer.hoverAlt?.length), {
    message: 'Décrivez l’image de survol pour les lecteurs d’écran.',
    path: ['hoverAlt'],
  });
export type Offer = z.infer<typeof offerSchema>;

export {
  vitrineProjects,
  projectClients,
  clientPieces,
  layoutPieces,
  logoAlias,
  canonicalLogo,
  photoSizes,
  projectSides,
  type Piece,
  type VitrineProject,
} from './vitrine-projects';

export const projectImageSchema = z.object({
  file: text.max(150),
  image: z
    .string()
    .regex(/^\/api\/v1\/project-images\/[a-f0-9-]+$/)
    .nullable(),
  alt: text.max(300),
  project: z.string().optional(),
  sources: responsiveImageSourcesSchema.optional(),
  size: z.enum(['small', 'medium', 'large']).nullable().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});
export type ProjectImage = z.infer<typeof projectImageSchema>;

// Limite commune aux deux serveurs ; aucune variable d’environnement côté navigateur.
export function imageUploadLimit(value?: string) {
  const bytes = value === undefined ? 5 * 1024 * 1024 : Number(value);
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > 50 * 1024 * 1024)
    throw new Error('IMAGE_MAX_BYTES doit être un entier entre 1 et 52428800.');
  return bytes;
}

export {
  imageVariantWidths,
  imageVariantVersion,
  imageVariantUrl,
  imageVariantSources,
  type ResponsiveImageSource,
  type ImageVariantWidth,
} from './image-variants';

export { vitrineAssetFiles } from './vitrine-assets';
export const vitrineImageSchema = z.object({
  file: z.string().min(1).max(200),
  image: z.string().regex(/^\/api\/v1\/vitrine-images\/[a-f0-9-]+$/),
  sources: responsiveImageSourcesSchema.optional(),
});
export type VitrineImage = z.infer<typeof vitrineImageSchema>;
