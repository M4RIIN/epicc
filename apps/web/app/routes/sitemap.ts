import { loadClients } from '../services/clients.server';
import { getSiteOrigin } from '../services/site.server';

export async function loader() {
  const clients = await loadClients();
  const origin = getSiteOrigin()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
  const paths = [
    '/',
    '/clients',
    ...clients.map((client) => `/clients/${client.slug}`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`,
    {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    },
  );
}
