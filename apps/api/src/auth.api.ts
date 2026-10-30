import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import type { Database } from './database';
import { authorized } from './clients.api';

export function createAuthApi(database: Database) {
  const api = new Hono();
  api.use('/v1/auth/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!authorized(c.req.header('Authorization')))
      return c.json({ error: 'Accès refusé.' }, 401);
    await next();
  });
  api.use('/v1/auth/*', bodyLimit({ maxSize: 4096 }));
  const attempts = { count: 0, reset: 0 };
  api.post('/v1/auth/login', async (c) => {
    const now = Date.now();
    if (now > attempts.reset) {
      attempts.count = 0;
      attempts.reset = now + 15 * 60 * 1000;
    }
    if (attempts.count >= 20)
      return c.json(
        { error: 'Trop de tentatives. Réessayez dans quinze minutes.' },
        429,
      );
    attempts.count++;
    const parsed = z
      .object({ email: z.string().max(254), password: z.string().max(1024) })
      .safeParse(await c.req.json().catch(() => null));
    if (
      !parsed.success ||
      !(await database.authenticate(parsed.data.email, parsed.data.password))
    )
      return c.json({ error: 'Identifiants incorrects.' }, 401);
    attempts.count = 0;
    return c.json({ ok: true });
  });
  return api;
}
