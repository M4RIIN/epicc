import { Hono } from 'hono';
import type { Database } from './database';
import { imageResponse } from './image-response';
import {
  requestedImageWidth,
  optimizedImageResponse,
  publicImageSources,
} from './image-variants';

export function createVitrineApi(database: Database) {
  const api = new Hono();
  api.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  api.get('/v1/vitrine-images', async (c) => {
    const result = await database.pool.query<{
      file: string;
      image_id: string;
    }>('SELECT file, image_id FROM vitrine_originals ORDER BY file');
    const images = result.rows.map((row) => ({
      file: row.file,
      image: `/api/v1/vitrine-images/${row.image_id}`,
    }));
    const sourcesFor = await publicImageSources(
      database,
      images.map((item) => item.image),
    );
    return c.json(
      images.map((item) => ({ ...item, sources: sourcesFor(item.image) })),
    );
  });
  api.get('/v1/vitrine-images/:id', async (c) => {
    const id = c.req.param('id');
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return c.notFound();
    const width = requestedImageWidth(c);
    if (width instanceof Response) return width;
    const result = await database.pool.query(
      `SELECT ${width === null ? 'mime, content, storage_key' : 'id, mime'} FROM images WHERE id=$1 AND EXISTS (SELECT 1 FROM vitrine_originals WHERE image_id=images.id)`,
      [id],
    );
    if (!result.rows[0]) return c.notFound();
    if (width !== null) {
      if (result.rows[0].mime === 'image/svg+xml')
        return c.json({ error: 'Ce visuel est vectoriel.' }, 400);
      return optimizedImageResponse(c, database, id, width);
    }
    return imageResponse(
      c,
      await database.images.read(result.rows[0]),
      true,
      true,
    );
  });
  // Le filet des champs est une ressource vectorielle fixe utilisée en CSS.
  api.get('/v1/vitrine-assets/:file', async (c) => {
    if (c.req.param('file') !== 'projets-Line18.svg') return c.notFound();
    const result = await database.pool.query(
      'SELECT mime, content, storage_key FROM images JOIN vitrine_originals ON image_id=id WHERE file=$1',
      [c.req.param('file')],
    );
    if (!result.rows[0]) return c.notFound();
    return imageResponse(c, await database.images.read(result.rows[0]));
  });
  return api;
}
