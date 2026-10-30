import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { Database, hashPassword } from './database';

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(1024),
});

export async function createAdministrator(
  database: Database,
  email: string,
  password: string,
) {
  const credentials = credentialsSchema.parse({
    email: email.trim(),
    password,
  });
  const result = await database.pool.query(
    'INSERT INTO administrators (email, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING email',
    [credentials.email, await hashPassword(credentials.password)],
  );
  if (!result.rowCount)
    throw new Error(
      'Ce compte administrateur existe déjà. Son mot de passe est inchangé.',
    );
  return credentials.email;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const email = process.env.ADMIN_EMAIL;
  if (!email)
    throw new Error(
      'ADMIN_EMAIL est obligatoire pour créer le compte administrateur.',
    );
  const password =
    process.env.ADMIN_PASSWORD || randomBytes(24).toString('base64url');
  const database = new Database();
  try {
    await database.migrate({ provisionAdmin: false });
    const created = await createAdministrator(database, email, password);
    console.info(`Compte administrateur créé : ${created}`);
    if (!process.env.ADMIN_PASSWORD)
      console.info(`Mot de passe généré (à conserver) : ${password}`);
    console.info(
      'Connexion disponible sur /connect avec SESSION_SECRET configuré sur le serveur.',
    );
  } catch (error) {
    console.error(
      error instanceof z.ZodError
        ? 'Adresse e-mail ou mot de passe invalide.'
        : error instanceof Error && error.message.startsWith('Ce compte')
          ? error.message
          : 'Création impossible. Vérifiez la connexion PostgreSQL et les droits du compte serveur.',
    );
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}
