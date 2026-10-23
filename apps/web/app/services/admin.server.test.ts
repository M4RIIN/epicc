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
});

it('signe les sessions, contrôle leur expiration et refuse les cookies altérés', async () => {
  vi.stubEnv('ADMIN_PASSWORD', '');
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

it('accepte des identifiants libres sans configuration administrateur', () => {
  vi.stubEnv('ADMIN_PASSWORD', '');
  vi.stubEnv('SESSION_SECRET', '');
  expect(login('demo', 'au-choix')).toBeNull();
  expect(login('test@questboard.test', 'testtest')).toBeNull();
  for (let attempt = 0; attempt < 25; attempt++)
    expect(login('autre identifiant', 'autre mot de passe')).toBeNull();
});

it('demande de remplir les deux champs', () => {
  expect(login('', 'testtest')).toContain('Saisissez');
  expect(login('   ', 'testtest')).toContain('Saisissez');
  expect(login('demo', '')).toContain('Saisissez');
});
