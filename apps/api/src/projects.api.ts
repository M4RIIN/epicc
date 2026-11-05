import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { projectImageSchema, vitrineProjects } from '@epicc/content-contracts';
import type { Database } from './database';
import { authorized } from './clients.api';
import { readImage } from './image-upload';
import { removeUnusedImages } from './clients.store';

const pieces = vitrineProjects.flatMap((project) =>
  project.pieces.map((piece, index) => ({
    file: piece.file,
    image: null,
    alt: index === 0 ? project.name : (piece.alt ?? project.name),
  })),
);

export function createProjectsApi(database: Database) {
  const api = new Hono();
  api.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  api.get('/v1/project-images', async (c) => {
    const result = await database.pool.query(
      'SELECT content FROM project_images',
    );
    const overrides = projectImageSchema
      .array()
      .parse(result.rows.map((row) => row.content));
    return c.json(
      pieces.map(
        (piece) => overrides.find((item) => item.file === piece.file) ?? piece,
      ),
    );
  });
  api.get('/v1/project-images/:id', async (c) => {
    const id = c.req.param('id');
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return c.notFound();
    const result = await database.pool.query<{ mime: string; content: Buffer }>(
      `SELECT mime, content FROM images WHERE id = $1 AND EXISTS (
        SELECT 1 FROM project_images WHERE content->>'image' = '/api/v1/project-images/' || images.id
      )`,
      [id],
    );
    const image = result.rows[0];
    if (!image) return c.notFound();
    c.header('Content-Type', image.mime);
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(Buffer.from(image.content));
  });
  api.use('/v1/admin/project-images/*', async (c, next) => {
    c.header('X-Robots-Tag', 'noindex, nofollow');
    if (!authorized(c.req.header('Authorization')))
      return c.json({ error: 'Accès refusé.' }, 401);
    await next();
  });
  api.use(
    '/v1/admin/project-images/*',
    bodyLimit({ maxSize: 6 * 1024 * 1024 }),
  );
  api.post('/v1/admin/project-images/:file', async (c) => {
    const file = c.req.param('file');
    if (!pieces.some((piece) => piece.file === file))
      return c.json({ error: 'Visuel introuvable.' }, 404);
    const form = await c.req.formData();
    if (form.get('restore') === 'yes') {
      await database.transaction(async (connection) => {
        await connection.query('DELETE FROM project_images WHERE file = $1', [
          file,
        ]);
        await removeUnusedImages(connection);
      });
      return c.json({ ok: true });
    }
    let image;
    try {
      image = await readImage(form.get('image'));
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
    const current = await database.pool.query(
      'SELECT content FROM project_images WHERE file = $1',
      [file],
    );
    const id = image ? randomUUID() : null;
    const parsed = projectImageSchema.safeParse({
      file,
      image: id
        ? `/api/v1/project-images/${id}`
        : (current.rows[0]?.content.image ?? null),
      alt: String(form.get('alt') ?? ''),
    });
    if (!parsed.success)
      return c.json(
        {
          error:
            'Décrivez l’image pour les lecteurs d’écran (300 caractères maximum).',
        },
        400,
      );
    await database.transaction(async (connection) => {
      if (image)
        await connection.query('INSERT INTO images VALUES ($1, $2, $3)', [
          id,
          image.mime,
          Buffer.from(image.content),
        ]);
      await connection.query(
        'INSERT INTO project_images VALUES ($1, $2) ON CONFLICT (file) DO UPDATE SET content = EXCLUDED.content',
        [file, parsed.data],
      );
      await removeUnusedImages(connection);
    });
    return c.json({ ok: true });
  });
  return api;
}
