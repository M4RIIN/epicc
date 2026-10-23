import { createCookieSessionStorage, redirect } from 'react-router';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function adminConfigured() {
  return Boolean(
    process.env.ADMIN_PASSWORD &&
    (process.env.SESSION_SECRET?.length ?? 0) >= 32,
  );
}
const fallbackSecret = randomBytes(32).toString('hex');
function storage() {
  return createCookieSessionStorage({
    cookie: {
      name: '__epicc_admin',
      httpOnly: true,
      sameSite: 'strict',
      // Les requêtes React Router utilisent aussi /connect.data.
      path: '/',
      secure:
        process.env.NODE_ENV === 'production' &&
        process.env.PUBLIC_SITE_URL?.startsWith('https:') === true,
      secrets: [process.env.SESSION_SECRET ?? fallbackSecret],
      maxAge: 8 * 60 * 60,
    },
  });
}
export async function adminSession(request: Request) {
  const session = await storage().getSession(request.headers.get('Cookie'));
  if (!session.has('csrf'))
    session.set('csrf', randomBytes(32).toString('hex'));
  return session;
}
export type AdminSession = Awaited<ReturnType<typeof adminSession>>;
export function isAdmin(session: AdminSession) {
  return (
    adminConfigured() &&
    session.get('admin') === true &&
    Number(session.get('expiresAt')) > Date.now()
  );
}
export async function requireAdmin(request: Request) {
  const session = await adminSession(request);
  if (!isAdmin(session)) throw redirect('/connect');
  return session;
}
export function commitAdmin(session: AdminSession) {
  return storage().commitSession(session);
}
export function logoutAdmin(session: AdminSession) {
  return storage().destroySession(session);
}
export function verifyCsrf(
  request: Request,
  form: FormData,
  session: AdminSession,
) {
  const origin = request.headers.get('Origin');
  const expected = process.env.PUBLIC_SITE_URL
    ? new URL(process.env.PUBLIC_SITE_URL).origin
    : new URL(request.url).origin;
  if (
    (origin && origin !== expected) ||
    form.get('csrf') !== session.get('csrf')
  ) {
    throw new Response(
      'Formulaire expiré ou origine refusée. Rechargez la page.',
      { status: 403 },
    );
  }
}
const attempts = { count: 0, reset: 0 };
export function login(email: string, password: string) {
  const now = Date.now();
  if (now > attempts.reset) {
    attempts.count = 0;
    attempts.reset = now + 15 * 60 * 1000;
  }
  if (attempts.count >= 20)
    return 'Trop de tentatives. Réessayez dans quinze minutes.';
  attempts.count++;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  if (
    !adminConfigured() ||
    email !== (process.env.ADMIN_EMAIL ?? 'test@questboard.test') ||
    !timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD ?? ''))
  ) {
    return 'Identifiants incorrects.';
  }
  attempts.count = 0;
  return null;
}

export async function readAdminForm(request: Request) {
  const limit = 6 * 1024 * 1024;
  if (Number(request.headers.get('Content-Length')) > limit)
    throw new Response('Formulaire trop volumineux (6 Mo maximum).', {
      status: 413,
    });
  const reader = request.body?.getReader();
  if (!reader) return new FormData();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Response('Formulaire trop volumineux (6 Mo maximum).', {
        status: 413,
      });
    }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), {
    headers: { 'Content-Type': request.headers.get('Content-Type') ?? '' },
  }).formData();
}
