import { assertImageReference } from './images.store';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { randomUUID } from 'node:crypto';
import { offerSchema } from '@epicc/content-contracts';
import type { Database } from './database';
import { authorized } from './clients.api';
import { readImage, uploadBodyLimit } from './image-upload';
import { imageResponse } from './image-response';
import {
  requestedImageWidth,
  optimizedImageResponse,
  publicImageSources,
} from './image-variants';

export function createOffersApi(database: Database) {
  const api = new Hono();
  api.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  api.get('/v1/offers', async (c) => {
    const result = await database.pool.query(
      "SELECT content FROM offers ORDER BY (content->>'position')::integer, slug",
    );
    const offers = offerSchema
      .array()
      .parse(result.rows.map((row) => row.content));
    const sourcesFor = await publicImageSources(
      database,
      offers.flatMap((offer) => [offer.image, offer.hoverImage ?? null]),
    );
    return c.json(
      offers.map((offer) => ({
        ...offer,
        sources: sourcesFor(offer.image),
        hoverSources: sourcesFor(offer.hoverImage ?? null),
      })),
    );
  });
  api.get('/v1/offer-images/:id', async (c) => {
    const id = c.req.param('id');
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return c.notFound();
    const width = requestedImageWidth(c);
    if (width instanceof Response) return width;
    const result = await database.pool.query<{
      mime: string;
      content: Buffer | null;
      storage_key: string | null;
    }>(
      `SELECT ${width === null ? 'mime, content, storage_key' : 'id'} FROM images WHERE id = $1 AND EXISTS (
      SELECT 1 FROM offers WHERE content->>'image' = '/api/v1/offer-images/' || images.id
      OR content->>'hoverImage' = '/api/v1/offer-images/' || images.id
    )`,
      [id],
    );
    if (!result.rows[0]) return c.notFound();
    if (width !== null) return optimizedImageResponse(c, database, id, width);
    const image = await database.images.read(result.rows[0]);
    return imageResponse(c, image);
  });
  api.use('/v1/admin/offers/*', async (c, next) => {
    if (!authorized(c.req.header('Authorization')))
      return c.json({ error: 'Accès refusé.' }, 401);
    await next();
  });
  api.use('/v1/admin/offers/*', bodyLimit({ maxSize: uploadBodyLimit() }));
  api.post('/v1/admin/offers/:slug', async (c) => {
    const slug = c.req.param('slug');
    const form = await c.req.formData();
    const result = await database.pool.query(
      'SELECT content FROM offers WHERE slug = $1',
      [slug],
    );
    if (!result.rows[0]) return c.notFound();
    const current = offerSchema.parse(result.rows[0].content);
    const hover = form.get('target') === 'hover';
    const imageField = hover ? 'hoverImage' : 'image';
    const altField = hover ? 'hoverAlt' : 'alt';
    let image;
    try {
      image = await readImage(form.get('image'));
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
    const id = image ? randomUUID() : null;
    const parsed = offerSchema.safeParse({
      ...current,
      [imageField]: id
        ? `/api/v1/offer-images/${id}`
        : form.get('removeImage') === 'yes'
          ? null
          : (current[imageField] ?? null),
      [altField]: String(form.get('alt') ?? ''),
    });
    if (!parsed.success)
      return c.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(' ') },
        400,
      );
    await database.images.write(id, image, async (connection) => {
      await assertImageReference(connection, parsed.data.image);
      await assertImageReference(connection, parsed.data.hoverImage ?? null);
      await connection.query('UPDATE offers SET content = $2 WHERE slug = $1', [
        slug,
        parsed.data,
      ]);
      await connection.query(
        "INSERT INTO migrations VALUES ('postgres-edited') ON CONFLICT DO NOTHING",
      );
    });
    return c.json({ ok: true });
  });
  return api;
}
