import { afterEach, expect, it, vi } from 'vitest';
import { getContactEmail } from './site.server';

afterEach(() => vi.unstubAllEnvs());

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

it('utilise uniquement l’adresse de contact explicitement configurée', () => {
  vi.stubEnv('CONTACT_EMAIL', ' test@questboard.test ');
  expect(getContactEmail()).toBe('test@questboard.test');
});
