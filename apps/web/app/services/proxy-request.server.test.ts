import { afterEach, expect, it, vi } from 'vitest';
import { adminSession, commitAdmin } from './admin.server';
import { prepareRequest } from './proxy-request.server';

afterEach(() => {
  vi.unstubAllEnvs();
});
async function formRequest({
  token = true,
  cookie = true,
  path = '/connect.data',
  origin = 'https://apercu.questboard.test',
} = {}) {
  vi.stubEnv(
    'SESSION_SECRET',
    'secret-de-test-proxy-avec-plus-de-trente-deux-caracteres',
  );
  vi.stubEnv('PUBLIC_SITE_URL', '');
  const session = await adminSession(
    new Request('http://127.0.0.1:3188/connect'),
  );
  const signed = (await commitAdmin(session)).split(';')[0]!;
  const form = new FormData();
  form.set('csrf', token ? session.get('csrf') : 'incorrect');
  form.set('email', 'test@questboard.test');
  return new Request(`http://127.0.0.1:3188${path}`, {
    method: 'POST',
    headers: { Origin: origin, Cookie: cookie ? signed : '' },
    body: form,
  });
}
it('rétablit l’origine du navigateur après validation du cookie et du jeton, sans consommer le formulaire', async () => {
  const request = await formRequest();
  const normalized = await prepareRequest(request);
  expect(normalized.url).toBe('https://apercu.questboard.test/connect.data');
  expect((await normalized.formData()).get('email')).toBe(
    'test@questboard.test',
  );
});
it('ne fait confiance ni à Origin ni aux en-têtes de proxy sans jeton et cookie valides', async () => {
  for (const options of [{ token: false }, { cookie: false }]) {
    const request = await formRequest(options);
    request.headers.set('X-Forwarded-Host', 'apercu.questboard.test');
    request.headers.set('X-Forwarded-Proto', 'https');
    expect(await prepareRequest(request)).toBe(request);
    expect((await request.formData()).get('email')).toBe(
      'test@questboard.test',
    );
  }
});
it('conserve la priorité du domaine public explicitement configuré', async () => {
  const request = await formRequest();
  vi.stubEnv('PUBLIC_SITE_URL', 'https://epicc.questboard.test');
  expect(await prepareRequest(request)).toBe(request);
});
it('ne modifie ni les lectures, ni les routes publiques, ni une origine invalide', async () => {
  for (const options of [
    { path: '/clients' },
    { origin: 'null' },
    { origin: 'ftp://apercu.questboard.test' },
    { origin: 'https://apercu.questboard.test/path' },
  ]) {
    const request = await formRequest(options);
    expect(await prepareRequest(request)).toBe(request);
  }
  const request = new Request('http://127.0.0.1:3188/connect', {
    headers: { Origin: 'https://apercu.questboard.test' },
  });
  expect(await prepareRequest(request)).toBe(request);
});
