import type { Route } from './+types/admin-image';
import { requireAdmin } from '../services/admin.server';
import { clientsRequest } from '../services/clients.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  const response = await clientsRequest(
    `admin/images/${encodeURIComponent(params.id)}`,
    {},
    true,
  );
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type':
        response.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
