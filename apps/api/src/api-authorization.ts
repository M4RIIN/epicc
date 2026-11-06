import { createHash, timingSafeEqual } from 'node:crypto';

export function authorized(header: string | undefined) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const expected = `Bearer ${createHash('sha256').update(`clients-api:${secret}`).digest('hex')}`;
  const supplied = Buffer.from(header ?? '');
  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, Buffer.from(expected))
  );
}
