import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { createRequestHandler } from 'react-router';
import type { ServerBuild } from 'react-router';
import { fileURLToPath } from 'node:url';
import { composeApi } from './composition-root';
import { Database } from './database';

const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? (production ? 3100 : 3101));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT doit être un numéro de port valide.');
}

const app = new Hono();
app.use('*', secureHeaders({ referrerPolicy: 'same-origin' }));
app.use('/connect*', async (context, next) => {
  await next();
  context.header('X-Robots-Tag', 'noindex, nofollow');
  context.header('Cache-Control', 'no-store');
});
const database = new Database();
try {
  await database.migrate();
} catch {
  await database.close();
  throw new Error(
    'Initialisation PostgreSQL impossible. Vérifiez DATABASE_URL et les droits de création des tables.',
  );
}
app.route('/api', composeApi(database));
app.all('/api/*', (context) =>
  context.json({ error: 'Ressource introuvable.' }, 404),
);

if (production) {
  const webBuildUrl = new URL('../web/server/index.js', import.meta.url);
  const build: ServerBuild = await import(webBuildUrl.href);
  const handleRequest = createRequestHandler(build, 'production');
  const clientRoot = fileURLToPath(new URL('../web/client/', import.meta.url));
  app.use('/assets/*', serveStatic({ root: clientRoot }));
  app.use('/images/*', serveStatic({ root: clientRoot }));
  app.use('/fonts/*', serveStatic({ root: clientRoot }));
  // L’adaptation des formulaires reste dans le bundle web avec les sessions.
  const prepareRequest = (
    build.entry.module as ServerBuild['entry']['module'] & {
      prepareRequest?: (request: Request) => Promise<Request>;
    }
  ).prepareRequest;
  app.all('*', async (context) => {
    let request = context.req.raw;
    if (process.env.PUBLIC_SITE_URL) {
      // Le domaine configuré reste prioritaire ; les en-têtes Forwarded ne font pas foi.
      const url = new URL(request.url);
      const origin = new URL(process.env.PUBLIC_SITE_URL);
      url.protocol = origin.protocol;
      url.host = origin.host;
      url.port = origin.port;
      request = new Request(url, request);
    }
    return handleRequest(
      prepareRequest ? await prepareRequest(request) : request,
    );
  });
}

const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.info(`Serveur disponible sur http://localhost:${port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(async (error) => {
      await database.close();
      if (error) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  });
}
