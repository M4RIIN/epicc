import { createHash } from 'node:crypto';
import type { Context } from 'hono';

export function imageResponse(
  c: Context,
  image: { mime: string; content: Uint8Array; sha256?: string },
  publicly = true,
  immutable = false,
) {
  c.header('Content-Type', image.mime);
  c.header('X-Content-Type-Options', 'nosniff');
  // Les brouillons repassent toujours par le contrôle d’accès ; aucun cache partagé.
  c.header(
    'Cache-Control',
    publicly
      ? immutable
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate'
      : 'private, no-store',
  );
  const etag = `"${image.sha256 ?? createHash('sha256').update(image.content).digest('hex')}"`;
  c.header('ETag', etag);
  if (
    publicly &&
    c.req
      .header('If-None-Match')
      ?.split(',')
      .map((v) => v.trim().replace(/^W\//, ''))
      .includes(etag)
  )
    return c.body(null, 304);
  return c.body(Buffer.from(image.content));
}
