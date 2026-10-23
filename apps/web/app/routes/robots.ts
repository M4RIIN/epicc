import { getSiteOrigin } from '../services/site.server';

export function loader() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /connect\nDisallow: /api/\nSitemap: ${getSiteOrigin()}/sitemap.xml\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
}
