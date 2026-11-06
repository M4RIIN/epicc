import { assertImageReference } from './images.store';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import {
  projectImageSchema,
  projectClients,
  logoAlias,
  canonicalLogo,
} from '@epicc/content-contracts';
import type { Database } from './database';
import { authorized } from './clients.api';
import { readImage, uploadBodyLimit } from './image-upload';
import { imageResponse } from './image-response';

const pieces = projectClients.flatMap((project) =>
  project.pieces.map((piece) => ({
    file: piece.file,
    project: project.name,
    image: null,
    alt: piece.role === 'name' ? project.name : (piece.alt ?? project.name),
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
      'SELECT content FROM project_images ORDER BY file',
    );
    const overrides = projectImageSchema
      .array()
      .parse(result.rows.map((row) => row.content));
    const originals = await database.pool.query(
      'SELECT file, image_id FROM project_originals',
    );
    const overrideFor = (file: string) =>
      overrides.find((item) => item.file === file) ??
      (file === canonicalLogo
        ? overrides.find((item) => item.file === logoAlias)
        : undefined);
    const images = pieces.map((piece) => {
      const original = originals.rows.find((row) => row.file === piece.file);
      const override = overrideFor(piece.file);
      return {
        ...piece,
        ...override,
        file: piece.file,
        image:
          override?.image ??
          (original ? `/api/v1/project-images/${original.image_id}` : null),
      };
    });
    const logo = images.find((item) => item.file === canonicalLogo)!;
    const aliasOriginal = originals.rows.find((row) => row.file === logoAlias);
    const aliasImage =
      overrideFor(canonicalLogo)?.image ??
      (aliasOriginal
        ? `/api/v1/project-images/${aliasOriginal.image_id}`
        : null);
    return c.json([
      ...images,
      ...overrides.filter(
        (item) =>
          !pieces.some((piece) => piece.file === item.file) &&
          item.file !== logoAlias,
      ),
      { ...logo, file: logoAlias, image: aliasImage },
    ]);
  });
  api.get('/v1/project-images/:id', async (c) => {
    const id = c.req.param('id');
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return c.notFound();
    const result = await database.pool.query<{
      mime: string;
      content: Buffer | null;
      storage_key: string | null;
    }>(
      `SELECT mime, content, storage_key FROM images WHERE id = $1 AND (
      EXISTS (SELECT 1 FROM project_images WHERE content->>'image' = '/api/v1/project-images/' || images.id)
      OR EXISTS (SELECT 1 FROM project_originals WHERE image_id = images.id))`,
      [id],
    );
    if (!result.rows[0]) return c.notFound();
    return imageResponse(c, await database.images.read(result.rows[0]));
  });
  api.use('/v1/admin/project-images/*', async (c, next) => {
    c.header('X-Robots-Tag', 'noindex, nofollow');
    if (!authorized(c.req.header('Authorization')))
      return c.json({ error: 'Accès refusé.' }, 401);
    await next();
  });
  api.use(
    '/v1/admin/project-images/*',
    bodyLimit({ maxSize: uploadBodyLimit() }),
  );
  api.post('/v1/admin/project-images/:file', async (c) => {
    const target = c.req.param('file');
    const file = target === logoAlias ? canonicalLogo : target;
    const form = await c.req.formData();
    const current = await database.pool.query(
      'SELECT content FROM project_images WHERE file = $1 OR ($1 = $2 AND file = $3) ORDER BY (file = $1) DESC',
      [file, canonicalLogo, logoAlias],
    );
    const original = pieces.find((piece) => piece.file === file);
    const creating = file === 'nouvelle';
    const project = projectClients.find(
      (item) =>
        item.name ===
        (creating
          ? form.get('project')
          : (original?.project ?? current.rows[0]?.content.project)),
    );
    if (!project || (!creating && !original && !current.rows[0]))
      return c.json({ error: 'Visuel introuvable.' }, 404);
    const photo =
      creating ||
      !original ||
      project.pieces.find((piece) => piece.file === file)?.role === 'photo';
    if (form.get('restore') === 'yes' || form.get('intent') === 'delete') {
      if (creating || (original && form.get('intent') === 'delete'))
        return c.json(
          {
            error: 'Un visuel d’origine peut être rétabli, mais pas supprimé.',
          },
          400,
        );
      await database.images.write(null, undefined, async (connection) => {
        await connection.query(
          'DELETE FROM project_images WHERE file = $1 OR ($1 = $2 AND file = $3)',
          [file, canonicalLogo, logoAlias],
        );
      });
      return c.json({ ok: true });
    }
    let image;
    try {
      image = await readImage(form.get('image'));
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
    if (creating && !image)
      return c.json({ error: 'Choisissez une photo.' }, 400);
    const id = image ? randomUUID() : null;
    const size = form.has('size')
      ? form.get('size') || null
      : (current.rows[0]?.content.size ?? null);
    if ((creating || !original) && !size)
      return c.json({ error: 'Choisissez une taille.' }, 400);
    const parsed = projectImageSchema.safeParse({
      file: creating ? `photo-${Date.now()}-${randomUUID()}` : file,
      project: project.name,
      image: id
        ? `/api/v1/project-images/${id}`
        : (current.rows[0]?.content.image ?? null),
      alt: String(form.get('alt') ?? ''),
      size: photo ? size : null,
      // Les proportions historiques font foi pour les emplacements d’origine.
      width: original
        ? undefined
        : (image?.width ?? current.rows[0]?.content.width),
      height: original
        ? undefined
        : (image?.height ?? current.rows[0]?.content.height),
    });
    if (!parsed.success)
      return c.json(
        {
          error:
            'Texte alternatif ou taille invalide (300 caractères maximum).',
        },
        400,
      );
    await database.images.write(id, image, async (connection) => {
      await assertImageReference(connection, parsed.data.image);
      if (file === canonicalLogo)
        await connection.query('DELETE FROM project_images WHERE file=$1', [
          logoAlias,
        ]);
      await connection.query(
        'INSERT INTO project_images VALUES ($1, $2) ON CONFLICT (file) DO UPDATE SET content = EXCLUDED.content',
        [parsed.data.file, parsed.data],
      );
    });
    return c.json({ ok: true });
  });
  return api;
}
