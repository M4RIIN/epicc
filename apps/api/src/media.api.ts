import { Hono } from 'hono';
import { authorized } from './api-authorization';
import { imageResponse } from './image-response';
import type { Database } from './database';

export function createMediaApi(database: Database) {
  const api = new Hono();
  api.get('/v1/admin/images/:id', async (c) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Robots-Tag', 'noindex, nofollow');
    if (!authorized(c.req.header('Authorization')))
      return c.json({ error: 'Accès refusé.' }, 401);
    const id = c.req.param('id');
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return c.notFound();
    const result = await database.pool.query(
      'SELECT mime, content, storage_key FROM images WHERE id = $1',
      [id],
    );
    if (!result.rows[0]) return c.notFound();
    return imageResponse(c, await database.images.read(result.rows[0]), false);
  });
  return api;
}
