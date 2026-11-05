import { afterEach, expect, it, vi } from 'vitest';
import { getContactEmail } from './site.server';

afterEach(() => vi.unstubAllEnvs());

it('active le contact avec l’adresse de test par défaut', () => {
  vi.stubEnv('CONTACT_EMAIL', undefined);
  expect(getContactEmail()).toBe('test@test.com');
});

it('ne propose pas d’envoi sans destinataire valide', () => {
  for (const email of [
    '',
    'adresse-incomplete',
    'test@questboard.test?bcc=autre@questboard.test',
  ]) {
    vi.stubEnv('CONTACT_EMAIL', email);
    expect(getContactEmail()).toBeNull();
  }
});

it('permet de remplacer l’adresse de test par la configuration', () => {
  vi.stubEnv('CONTACT_EMAIL', ' test@questboard.test ');
  expect(getContactEmail()).toBe('test@questboard.test');
});
