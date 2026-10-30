import { createHash } from 'node:crypto';
import { clientSchema } from '@epicc/content-contracts';

function apiOrigin() {
  return (
    process.env.INTERNAL_API_ORIGIN ??
    (process.env.NODE_ENV === 'production'
      ? `http://127.0.0.1:${process.env.PORT ?? '3100'}`
      : 'http://127.0.0.1:3101')
  );
}
export async function clientsRequest(
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
    throw new Response(
      'Les projets clients sont temporairement indisponibles.',
      {
        status: 503,
      },
    );
  }
}
export async function loadClients(admin = false) {
  const response = await clientsRequest(
    admin ? 'admin/clients' : 'clients',
    {},
    admin,
  );
  if (!response.ok)
    throw new Response(
      'Les projets clients sont temporairement indisponibles.',
      {
        status: 503,
      },
    );
  return clientSchema.array().parse(await response.json());
}
export async function saveClient(slug: string, form: FormData) {
  const response = await clientsRequest(
    `admin/clients/${encodeURIComponent(slug)}`,
    { method: 'POST', body: form },
    true,
  );
  if (!response.ok) {
    if ([400, 404, 409].includes(response.status)) {
      const result = (await response.json()) as { error: string };
      return result.error;
    }
    return 'Enregistrement impossible. Réessayez dans quelques instants.';
  }
  return null;
}
