import { index, route } from '@react-router/dev/routes';
import type { RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('clients/viandes-des-sommets', 'routes/viandes-des-sommets.tsx'),
  route('connect', 'routes/connect.tsx'),
  route('connect/projets/:file', 'routes/manage-project-image.tsx'),
  route('connect/offres/:slug', 'routes/manage-offer.tsx'),
  route('connect/images/:id', 'routes/admin-image.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
] satisfies RouteConfig;
