import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createHash, timingSafeEqual } from 'node:crypto';
import { clientSchema } from '@epicc/content-contracts';
import type { ClientStore } from './clients.store';

function authorized(header: string | undefined) {
  const secret = process.env.SESSION_SECRET;
  if (!process.env.ADMIN_PASSWORD || !secret || secret.length < 32)
    return false;
  const expected = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
  const supplied = Buffer.from(header ?? '');
  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, Buffer.from(expected))
  );
}

export function createClientsApi(store: ClientStore) {
  const api = new Hono();
  api.get('/v1/clients', (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json(store.list());
  });
  api.get('/v1/client-images/:id', (c) => {
    const image = store.image(c.req.param('id'));
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
  api.use('/v1/admin/*', bodyLimit({ maxSize: 6 * 1024 * 1024 }));
  api.get('/v1/admin/images/:id', (c) => {
    const image = store.image(c.req.param('id'), true);
    if (!image) return c.notFound();
    c.header('Content-Type', image.mime);
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(Buffer.from(image.content));
  });
  api.get('/v1/admin/clients', (c) => c.json(store.list(true)));
  api.post('/v1/admin/clients/:slug', async (c) => {
    const form = await c.req.formData();
    if (form.get('intent') === 'delete') {
      store.delete(c.req.param('slug'));
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
    const exists = store.list(true).some((item) => item.slug === client.slug);
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
    const file = form.get('image');
    let image: { mime: string; content: Uint8Array } | undefined;
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024)
        return c.json({ error: 'L’image doit peser au maximum 5 Mo.' }, 400);
      const content = new Uint8Array(await file.arrayBuffer());
      const hex = Buffer.from(content.subarray(0, 12)).toString('hex');
      const valid =
        (file.type === 'image/jpeg' && hex.startsWith('ffd8ff')) ||
        (file.type === 'image/png' && hex.startsWith('89504e470d0a1a0a')) ||
        (file.type === 'image/webp' &&
          hex.startsWith('52494646') &&
          hex.slice(16) === '57454250');
      if (!valid)
        return c.json(
          { error: 'Choisissez une image JPEG, PNG ou WebP valide.' },
          400,
        );
      image = { mime: file.type, content };
    }
    if (
      !image &&
      client.image.startsWith('/api/') &&
      !store
        .list(true)
        .some(
          (item) => item.slug === client.slug && item.image === client.image,
        )
    ) {
      return c.json(
        { error: 'Image inconnue. Téléversez une nouvelle image.' },
        400,
      );
    }
    store.write(client, image);
    return c.json({ ok: true });
  });
  return api;
}
