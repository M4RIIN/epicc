export function getSiteOrigin() {
  return new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:3100').origin;
}

export function getContactEmail() {
  const email = process.env.CONTACT_EMAIL?.trim();
  return email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)
    ? email
    : null;
}
