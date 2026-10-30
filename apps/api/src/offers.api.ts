import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { randomUUID } from 'node:crypto';
import { offerSchema } from '@epicc/content-contracts';
import type { Database } from './database';
import { authorized } from './clients.api';
import { readImage } from './image-upload';
import { removeUnusedImages } from './clients.store';

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
    return c.json(
      offerSchema.array().parse(result.rows.map((row) => row.content)),
    );
  });
  api.get('/v1/offer-images/:id', async (c) => {
    const id = c.req.param('id');
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return c.notFound();
    const result = await database.pool.query<{ mime: string; content: Buffer }>(
      `SELECT mime, content FROM images WHERE id = $1 AND EXISTS (
      SELECT 1 FROM offers WHERE content->>'image' = '/api/v1/offer-images/' || images.id
    )`,
      [id],
    );
    const image = result.rows[0];
    if (!image) return c.notFound();
    c.header('Content-Type', image.mime);
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(Buffer.from(image.content));
  });
  api.use('/v1/admin/offers/*', async (c, next) => {
    if (!authorized(c.req.header('Authorization')))
      return c.json({ error: 'Accès refusé.' }, 401);
    await next();
  });
  api.use('/v1/admin/offers/*', bodyLimit({ maxSize: 6 * 1024 * 1024 }));
  api.post('/v1/admin/offers/:slug', async (c) => {
    const slug = c.req.param('slug');
    const form = await c.req.formData();
    const result = await database.pool.query(
      'SELECT content FROM offers WHERE slug = $1',
      [slug],
    );
    if (!result.rows[0]) return c.notFound();
    const current = offerSchema.parse(result.rows[0].content);
    let image;
    try {
      image = await readImage(form.get('image'));
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
    const id = image ? randomUUID() : null;
    const parsed = offerSchema.safeParse({
      ...current,
      image: id
        ? `/api/v1/offer-images/${id}`
        : form.get('removeImage') === 'yes'
          ? null
          : current.image,
      alt: String(form.get('alt') ?? ''),
    });
    if (!parsed.success)
      return c.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(' ') },
        400,
      );
    await database.transaction(async (connection) => {
      if (image)
        await connection.query('INSERT INTO images VALUES ($1, $2, $3)', [
          id,
          image.mime,
          Buffer.from(image.content),
        ]);
      await connection.query('UPDATE offers SET content = $2 WHERE slug = $1', [
        slug,
        parsed.data,
      ]);
      await connection.query(
        "INSERT INTO migrations VALUES ('postgres-edited') ON CONFLICT DO NOTHING",
      );
      await removeUnusedImages(connection);
    });
    return c.json({ ok: true });
  });
  return api;
}
