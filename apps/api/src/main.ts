import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { createRequestHandler } from 'react-router';
import type { ServerBuild } from 'react-router';
import { fileURLToPath } from 'node:url';
import { composeApi } from './composition-root';

const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? (production ? 3100 : 3101));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT doit être un numéro de port valide.');
}

const app = new Hono();
app.use('*', secureHeaders());
app.route('/api', composeApi());
app.all('/api/*', (context) =>
  context.json({ error: 'Ressource introuvable.' }, 404),
);

if (production) {
  const webBuildUrl = new URL('../web/server/index.js', import.meta.url);
  const build: ServerBuild = await import(webBuildUrl.href);
  const handleRequest = createRequestHandler(build, 'production');
  const clientRoot = fileURLToPath(new URL('../web/client/', import.meta.url));
  app.use('/assets/*', serveStatic({ root: clientRoot }));
  app.all('*', (context) => handleRequest(context.req.raw));
}

const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.info(`Serveur disponible sur http://localhost:${port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close((error) => {
      if (error) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  });
}
