import { afterEach, expect, it, vi } from 'vitest';
import {
  adminSession,
  commitAdmin,
  isAdmin,
  login,
  readAdminForm,
  verifyCsrf,
} from './admin.server';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('signe les sessions, contrôle leur expiration et refuse les cookies altérés', async () => {
  vi.stubEnv('ADMIN_PASSWORD', 'testtest');
  vi.stubEnv('ADMIN_EMAIL', 'test@questboard.test');
  vi.stubEnv(
    'SESSION_SECRET',
    'secret-de-test-de-plus-de-trente-deux-caracteres',
  );
  const session = await adminSession(new Request('http://localhost/connect'));
  expect(isAdmin(session)).toBe(false);
  session.set('admin', true);
  session.set('expiresAt', Date.now() + 10000);
  const cookie = await commitAdmin(session);
  const restored = await adminSession(
    new Request('http://localhost/connect', {
      headers: { Cookie: cookie.split(';')[0]! },
    }),
  );
  expect(isAdmin(restored)).toBe(true);
  restored.set('expiresAt', Date.now() - 1);
  expect(isAdmin(restored)).toBe(false);
  const tampered = await adminSession(
    new Request('http://localhost/connect', {
      headers: { Cookie: cookie.split(';')[0]! + 'invalide' },
    }),
  );
  expect(isAdmin(tampered)).toBe(false);
});

it('refuse les formulaires sans jeton ou provenant d’une autre origine', async () => {
  vi.stubEnv('PUBLIC_SITE_URL', 'https://epicc.questboard.test');
  const request = new Request('https://epicc.questboard.test/connect', {
    method: 'POST',
  });
  const session = await adminSession(request);
  const form = new FormData();
  expect(() => verifyCsrf(request, form, session)).toThrow();
  form.set('csrf', session.get('csrf') as string);
  expect(() => verifyCsrf(request, form, session)).not.toThrow();
  expect(() =>
    verifyCsrf(
      new Request(request, {
        headers: { Origin: 'https://autre.questboard.test' },
      }),
      form,
      session,
    ),
  ).toThrow();
});

it('refuse les formulaires volumineux avant leur traitement', async () => {
  const request = new Request('http://localhost/connect', {
    method: 'POST',
    headers: { 'Content-Length': String(7 * 1024 * 1024) },
  });
  await expect(readAdminForm(request)).rejects.toMatchObject({ status: 413 });
});

it('délègue la connexion à l’API PostgreSQL et présente les refus', async () => {
  vi.stubEnv('SESSION_SECRET', '');
  expect(await login('test@questboard.test', 'testtest')).toBe(
    'Identifiants incorrects.',
  );
  vi.stubEnv(
    'SESSION_SECRET',
    'secret-de-test-de-plus-de-trente-deux-caracteres',
  );
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  expect(await login('test@questboard.test', 'testtest')).toBeNull();
  expect(fetcher).toHaveBeenCalledWith(
    expect.any(URL),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        email: 'test@questboard.test',
        password: 'testtest',
      }),
    }),
  );
  fetcher.mockResolvedValue(new Response('{}', { status: 401 }));
  expect(await login('test@questboard.test', 'incorrect')).toBe(
    'Identifiants incorrects.',
  );
  fetcher.mockResolvedValue(new Response('{}', { status: 429 }));
  expect(await login('test@questboard.test', 'testtest')).toContain(
    'Trop de tentatives',
  );
});
