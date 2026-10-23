export function getSiteOrigin() {
  return new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:3100').origin;
}
