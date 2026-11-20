import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

// Serveur de fichiers pour les aperçus locaux et les hébergements par conteneur.
const site = new URL('./site/', import.meta.url);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let path;
  try {
    path = new URL(request.url ?? '/', 'http://localhost').pathname;
  } catch {
    response.writeHead(400).end();
    return;
  }

  // Les noms publiés sont simples et ne nécessitent ni décodage ni réécriture.
  const allowed =
    /^\/(?:robots\.txt|sitemap\.xml|404\.html|clients\/[a-z-]+\/?|(?:assets|fonts)\/[\w.-]+)?$/;
  let file = allowed.test(path) ? path.slice(1) : '404.html';
  let status = file === '404.html' ? 404 : 200;
  if (!file || file.startsWith('clients/'))
    file = file.replace(/\/?$/, '/') + 'index.html';
  if (file.startsWith('/')) file = file.slice(1);

  try {
    const bytes = await readFile(new URL('./' + file, site)).catch(
      async (error) => {
        if (!['ENOENT', 'EISDIR'].includes(error.code)) throw error;
        file = '404.html';
        status = 404;
        return readFile(new URL(file, site));
      },
    );
    response
      .writeHead(status, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'Content-Length': bytes.length,
        'Cache-Control': file.startsWith('assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      })
      .end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(500).end();
  }
});

server.listen(Number(process.env.PORT ?? 3100), '0.0.0.0');
