import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { Context } from 'hono';
import {
  imageVariantSources,
  imageVariantVersion,
  imageVariantWidths,
  type ImageVariantWidth,
} from '@epicc/content-contracts';
import type { Database } from './database';
import { imageResponse } from './image-response';

export function requestedImageWidth(
  c: Context,
): ImageVariantWidth | null | Response {
  const width = c.req.query('w');
  const version = c.req.query('v');
  if (width === undefined && version === undefined) return null;
  const allowed = imageVariantWidths.find((value) => String(value) === width);
  if (allowed === undefined || version !== imageVariantVersion) {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Variante d’image inconnue.' }, 400);
  }
  return allowed;
}

type Variant = { content: Buffer; sha256: string };
const pending = new WeakMap<Database, Map<string, Promise<Variant>>>();
let workers = 0;
const waiting: Array<() => void> = [];
async function withImageWorker<T>(work: () => Promise<T>) {
  // Deux décodages au maximum, même lorsque plusieurs galeries arrivent ensemble.
  if (workers < 2) workers++;
  else await new Promise<void>((resolve) => waiting.push(resolve));
  try {
    return await work();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else workers--;
  }
}
async function readVariant(
  database: Database,
  id: string,
  width: ImageVariantWidth,
) {
  const cached = await database.pool.query<Variant>(
    'SELECT content, sha256 FROM image_variants WHERE image_id=$1 AND version=$2 AND width=$3',
    [id, imageVariantVersion, width],
  );
  if (cached.rows[0]) return cached.rows[0];
  let jobs = pending.get(database);
  if (!jobs) {
    jobs = new Map();
    pending.set(database, jobs);
  }
  const key = `${id}:${width}`;
  const existing = jobs.get(key);
  if (existing) return existing;
  const job = withImageWorker(async () => {
    const source = await database.pool.query(
      'SELECT mime, content, storage_key FROM images WHERE id=$1',
      [id],
    );
    if (!source.rows[0])
      throw new Error('Image supprimée pendant la conversion.');
    const original = await database.images.read(source.rows[0]);
    const content = await sharp(original.content, {
      limitInputPixels: 40_000_000,
    })
      .autoOrient()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100, effort: 4 })
      .toBuffer();
    const sha256 = createHash('sha256').update(content).digest('hex');
    // Le cache léger reste en base, même si les originaux résident dans S3.
    // La clé étrangère nettoie les variantes dès que leur original est supprimé.
    await database.pool.query(
      `INSERT INTO image_variants (image_id, version, width, content, sha256)
       SELECT $1,$2,$3,$4,$5 WHERE EXISTS (SELECT 1 FROM images WHERE id=$1)
       ON CONFLICT DO NOTHING`,
      [id, imageVariantVersion, width, content, sha256],
    );
    return { content, sha256 };
  });
  jobs.set(key, job);
  try {
    return await job;
  } finally {
    jobs.delete(key);
  }
}

// L’appelant vérifie la publication/la référence avant tout accès au cache.
export async function optimizedImageResponse(
  c: Context,
  database: Database,
  id: string,
  width: ImageVariantWidth,
) {
  const variant = await readVariant(database, id, width);
  return imageResponse(
    c,
    { mime: 'image/webp', content: variant.content, sha256: variant.sha256 },
    true,
    true,
  );
}

// Métadonnées seules : aucune lecture de l’original pour composer le HTML.
export async function publicImageSources(
  database: Database,
  urls: Array<string | null>,
) {
  const ids = [
    ...new Set(
      urls.flatMap((url) => {
        const match = url?.match(
          /^\/api\/v1\/(?:project|offer)-images\/([a-f0-9-]{36})$/,
        );
        return match?.[1] ? [match[1]] : [];
      }),
    ),
  ];
  const result = ids.length
    ? await database.pool.query<{ id: string; width: number | null }>(
        'SELECT id, width FROM images WHERE id = ANY($1::uuid[])',
        [ids],
      )
    : { rows: [] };
  return (url: string | null) => {
    const width = result.rows.find(
      (row) => row.id === url?.split('/').at(-1),
    )?.width;
    return url && width ? imageVariantSources(url, width) : undefined;
  };
}
