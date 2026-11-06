import { createServer } from 'node:http';
import { once } from 'node:events';
import { expect, it, vi } from 'vitest';
import { storageFromEnvironment } from './object-storage';

it('utilise le SDK S3 réel pour PUT, GET et DELETE avec signature côté serveur', async () => {
  const objects = new Map<string, Buffer>();
  const requests: {
    method: string | undefined;
    url: string | undefined;
    authorization: string | undefined;
  }[] = [];
  const server = createServer(async (req, res) => {
    requests.push({
      method: req.method,
      url: req.url,
      authorization: req.headers.authorization,
    });
    const key = req.url!.split('?')[0]!;
    if (req.method === 'PUT') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      objects.set(key, Buffer.concat(chunks));
      res.end();
    } else if (req.method === 'GET') {
      res.end(objects.get(key));
    } else if (req.method === 'DELETE') {
      objects.delete(key);
      res.statusCode = 204;
      res.end();
    } else {
      res.statusCode = 405;
      res.end();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Adresse absente.');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('MEDIA_STORAGE', 's3');
    vi.stubEnv('S3_ENDPOINT', `http://127.0.0.1:${address.port}`);
    vi.stubEnv('S3_REGION', 'auto');
    vi.stubEnv('S3_BUCKET', 'test-media');
    vi.stubEnv('S3_ACCESS_KEY_ID', 'test-access-key');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 'test-secret-key');
    vi.stubEnv('S3_FORCE_PATH_STYLE', 'true');
    const storage = storageFromEnvironment()!;
    const bytes = new Uint8Array([1, 2, 3]);
    await storage.put('media/test', bytes, 'image/png');
    expect(await storage.get('media/test')).toEqual(bytes);
    await storage.delete('media/test');
    expect(objects.size).toBe(0);
    expect(requests.map((r) => r.method)).toEqual(['PUT', 'GET', 'DELETE']);
    expect(
      requests.every((r) => r.url?.startsWith('/test-media/media/test')),
    ).toBe(true);
    expect(
      requests.every((r) => r.authorization?.startsWith('AWS4-HMAC-SHA256')),
    ).toBe(true);
    vi.stubEnv('NODE_ENV', 'production');
    expect(storageFromEnvironment).toThrow('HTTPS');
  } finally {
    vi.unstubAllEnvs();
    server.close();
    server.closeAllConnections();
    await once(server, 'close');
  }
});
it('refuse une configuration S3 incomplète sans revenir silencieusement à PostgreSQL', () => {
  vi.stubEnv('MEDIA_STORAGE', 's3');
  vi.stubEnv('S3_ENDPOINT', '');
  try {
    expect(storageFromEnvironment).toThrow('S3_ENDPOINT');
  } finally {
    vi.unstubAllEnvs();
  }
});
