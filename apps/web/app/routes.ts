import { index, route } from '@react-router/dev/routes';
import type { RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('clients', 'routes/directory.tsx'),
  route('clients/:slug', 'routes/client.tsx'),
  route('connect', 'routes/connect.tsx'),
  route('connect/images/:id', 'routes/admin-image.ts'),
  route('connect/clients/:slug', 'routes/manage-client.tsx'),
  route('robots.txt', 'routes/robots.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
] satisfies RouteConfig;
