import { readImage } from './image-upload';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createHash, timingSafeEqual } from 'node:crypto';
import { clientSchema, clientPhotoSchema } from '@epicc/content-contracts';
import type { ClientStore } from './clients.store';

export function authorized(header: string | undefined) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const expected = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
  const supplied = Buffer.from(header ?? '');
  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, Buffer.from(expected))
  );
}

export function createClientsApi(store: ClientStore) {
  const api = new Hono();
  api.get('/v1/clients', async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json(await store.list());
  });
  api.get('/v1/client-images/:id', async (c) => {
    const image = await store.image(c.req.param('id'));
    if (!image) return c.notFound();
    c.header('Content-Type', image.mime);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Cache-Control', 'no-store');
    return c.body(Buffer.from(image.content));
  });
  api.use('/v1/admin/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Robots-Tag', 'noindex, nofollow');
    if (!authorized(c.req.header('Authorization')))
      return c.json({ error: 'Accès refusé.' }, 401);
    await next();
  });
  api.use('/v1/admin/*', bodyLimit({ maxSize: 21 * 1024 * 1024 }));
  api.get('/v1/admin/images/:id', async (c) => {
    const image = await store.image(c.req.param('id'), true);
    if (!image) return c.notFound();
    c.header('Content-Type', image.mime);
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(Buffer.from(image.content));
  });
  api.get('/v1/admin/clients', async (c) => c.json(await store.list(true)));
  api.post('/v1/admin/clients-order', async (c) => {
    let slugs: unknown;
    try {
      slugs = JSON.parse(String((await c.req.formData()).get('slugs')));
    } catch {
      return c.json({ error: 'Ordre invalide.' }, 400);
    }
    if (
      !Array.isArray(slugs) ||
      slugs.some((slug) => typeof slug !== 'string') ||
      !(await store.reorder(slugs))
    )
      return c.json(
        { error: 'La liste des projets a changé. Actualisez la page.' },
        409,
      );
    return c.json({ ok: true });
  });
  api.post('/v1/admin/clients/:slug', async (c) => {
    const form = await c.req.formData();
    if (form.get('intent') === 'delete') {
      await store.delete(c.req.param('slug'));
      return c.json({ ok: true });
    }
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get('client')));
    } catch {
      return c.json({ error: 'Fiche invalide.' }, 400);
    }
    const result = clientSchema.safeParse(raw);
    if (!result.success)
      return c.json(
        {
          error: result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join(' '),
        },
        400,
      );
    const client = result.data;
    if (client.slug !== c.req.param('slug'))
      return c.json({ error: 'Identifiant incohérent.' }, 400);
    const exists = (await store.list(true)).some(
      (item) => item.slug === client.slug,
    );
    if (form.get('intent') === 'create' ? exists : !exists) {
      return c.json(
        {
          error: exists
            ? 'Cette adresse de fiche existe déjà.'
            : 'Fiche introuvable.',
        },
        exists ? 409 : 404,
      );
    }
    const current = (await store.list(true)).find(
      (item) => item.slug === client.slug,
    );
    if (
      client.gallery.some(
        (photo) =>
          !current?.gallery.some((saved) => saved.image === photo.image),
      )
    )
      return c.json({ error: 'Image de galerie inconnue.' }, 400);
    const galleryFiles = form
      .getAll('galleryImages')
      .filter((file) => file instanceof File && file.size > 0);
    const legacyPhoto = form.get('galleryImage');
    if (legacyPhoto instanceof File && legacyPhoto.size)
      galleryFiles.push(legacyPhoto);
    if (client.gallery.length + galleryFiles.length > 3)
      return c.json({ error: 'Quatre photos maximum par projet.' }, 400);
    let image;
    let galleryImages;
    let galleryReplacements;
    try {
      image = await readImage(form.get('image'));
      galleryImages = await Promise.all(
        galleryFiles.map((file) => readImage(file)),
      );
      galleryReplacements = await Promise.all(
        client.gallery.map((_, index) =>
          readImage(form.get(`galleryReplace${index}`)),
        ),
      );
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
    if (
      !image &&
      client.image.startsWith('/api/') &&
      !(await store.list(true)).some(
        (item) => item.slug === client.slug && item.image === client.image,
      )
    ) {
      return c.json(
        { error: 'Image inconnue. Téléversez une nouvelle image.' },
        400,
      );
    }
    const galleryPhotos = [];
    for (const [index, uploaded] of galleryImages.entries()) {
      const photo = clientPhotoSchema.pick({ alt: true }).safeParse({
        alt: String(
          form.getAll('galleryAlts')[index] ?? form.get('galleryAlt') ?? '',
        ),
      });
      if (!photo.success)
        return c.json({ error: 'Décrivez chaque photo du projet.' }, 400);
      if (uploaded)
        galleryPhotos.push({ image: uploaded, alt: photo.data.alt });
    }
    await store.write(
      client,
      image,
      form.get('intent') === 'create',
      galleryPhotos,
      galleryReplacements,
    );
    return c.json({ ok: true });
  });
  return api;
}
