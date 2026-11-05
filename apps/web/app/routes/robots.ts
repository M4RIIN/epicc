import { getSiteOrigin } from '../services/site.server';

export function loader() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /connect\nDisallow: /api/\nAllow: /api/v1/project-images/\nAllow: /api/v1/client-images/\nAllow: /api/v1/offer-images/\nSitemap: ${getSiteOrigin()}/sitemap.xml\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
}
