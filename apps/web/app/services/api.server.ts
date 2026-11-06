import { createHash } from 'node:crypto';

function apiOrigin() {
  return (
    process.env.INTERNAL_API_ORIGIN ??
    (process.env.NODE_ENV === 'production'
      ? `http://127.0.0.1:${process.env.PORT ?? '3100'}`
      : 'http://127.0.0.1:3101')
  );
}
export async function apiRequest(
  path: string,
  init: RequestInit = {},
  admin = false,
) {
  const headers = new Headers(init.headers);
  if (admin)
    headers.set(
      'Authorization',
      `Bearer ${createHash('sha256').update(`clients-api:${process.env.SESSION_SECRET}`).digest('hex')}`,
    );
  try {
    return await fetch(new URL(`/api/v1/${path}`, apiOrigin()), {
      ...init,
      headers,
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Response('Le service est temporairement indisponible.', {
      status: 503,
    });
  }
}
