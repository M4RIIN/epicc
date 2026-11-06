import { Pool, type PoolClient } from 'pg';
import { ImageStore, removeUnusedImages } from './images.store';
import { storageFromEnvironment, type ObjectStorage } from './object-storage';
import { randomBytes, scrypt as deriveKey, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { initialOffers, previousOffers } from './offers.seed';

const scrypt = promisify(deriveKey);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [salt, digest] = hash.split(':');
  if (!salt || !digest) return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(digest, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export class Database {
  readonly pool: Pool;
  readonly images: ImageStore;
  constructor(
    url = process.env.DATABASE_URL,
    storage: ObjectStorage | undefined = storageFromEnvironment(),
  ) {
    this.images = new ImageStore(this, storage);
    if (!url) throw new Error('DATABASE_URL est obligatoire (PostgreSQL).');
    this.pool = new Pool({
      connectionString: url,
      connectionTimeoutMillis: 5000,
    });
    this.pool.on('error', () =>
      console.error('Connexion PostgreSQL interrompue.'),
    );
  }
  async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async migrate({ provisionAdmin = true } = {}) {
    await this.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(310031)');
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS clients (slug TEXT PRIMARY KEY, content JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS images (id UUID PRIMARY KEY, mime TEXT NOT NULL, content BYTEA NOT NULL);
        CREATE TABLE IF NOT EXISTS vitrine_originals (file TEXT PRIMARY KEY, image_id UUID NOT NULL REFERENCES images(id));
        CREATE TABLE IF NOT EXISTS image_variants (
          image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
          version TEXT NOT NULL, width INTEGER NOT NULL,
          content BYTEA NOT NULL, sha256 TEXT NOT NULL,
          PRIMARY KEY (image_id, version, width)
        );
        CREATE TABLE IF NOT EXISTS project_originals (file TEXT PRIMARY KEY, image_id UUID NOT NULL REFERENCES images(id));
        CREATE TABLE IF NOT EXISTS project_images (file TEXT PRIMARY KEY, content JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS offers (slug TEXT PRIMARY KEY, content JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS administrators (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
      `);
      await client.query(`
        ALTER TABLE images ALTER COLUMN content DROP NOT NULL;
        ALTER TABLE images ADD COLUMN IF NOT EXISTS storage_key TEXT UNIQUE;
        ALTER TABLE images ADD COLUMN IF NOT EXISTS byte_size BIGINT;
        ALTER TABLE images ADD COLUMN IF NOT EXISTS width INTEGER;
        ALTER TABLE images ADD COLUMN IF NOT EXISTS height INTEGER;
        ALTER TABLE images ADD COLUMN IF NOT EXISTS sha256 TEXT;
        CREATE TABLE IF NOT EXISTS media_deletions (
          storage_key TEXT PRIMARY KEY, available_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      // Retrait définitif du répertoire historique, sans toucher aux médias
      // encore utilisés par les offres, les projets ou la vitrine.
      if (
        !(
          await client.query(
            "SELECT id FROM migrations WHERE id = 'remove-client-directory'",
          )
        ).rowCount
      ) {
        await client.query('SELECT pg_advisory_xact_lock(310032)');
        await client.query('DELETE FROM clients');
        await removeUnusedImages(client);
        await client.query(
          "INSERT INTO migrations VALUES ('remove-client-directory')",
        );
      }
      if (
        !(
          await client.query(
            "SELECT id FROM migrations WHERE id = 'seed-offers'",
          )
        ).rowCount
      ) {
        for (const offer of initialOffers) {
          await client.query(
            'INSERT INTO offers VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [offer.slug, offer],
          );
        }
        await client.query("INSERT INTO migrations VALUES ('seed-offers')");
      }
      // Mise à jour unique des textes d’origine, en conservant les images
      // et toute rédaction qui aurait été personnalisée.
      if (
        !(
          await client.query(
            "SELECT id FROM migrations WHERE id = 'vitrine-offers-2026-11'",
          )
        ).rowCount
      ) {
        for (const offer of initialOffers) {
          const previous = previousOffers.find(
            (item) => item.slug === offer.slug,
          );
          if (previous) {
            const { name, description, summary, position } = offer;
            await client.query(
              `UPDATE offers SET content = content || $2::jsonb
               WHERE slug = $1 AND content->>'name' = $3 AND content->>'description' = $4`,
              [
                offer.slug,
                { name, description, summary, position },
                previous.name,
                previous.description,
              ],
            );
          } else {
            await client.query(
              'INSERT INTO offers VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [offer.slug, offer],
            );
          }
        }
        await client.query(
          "INSERT INTO migrations VALUES ('vitrine-offers-2026-11')",
        );
      }
      // Les variables servent uniquement à créer le compte initial ; aucun mot de passe en clair en base.
      if (
        provisionAdmin &&
        process.env.ADMIN_EMAIL &&
        process.env.ADMIN_PASSWORD
      ) {
        const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
        if (
          !(
            await client.query(
              'SELECT email FROM administrators WHERE email = $1',
              [email],
            )
          ).rowCount
        ) {
          await client.query('INSERT INTO administrators VALUES ($1, $2)', [
            email,
            await hashPassword(process.env.ADMIN_PASSWORD),
          ]);
        }
      }
    });
  }
  async authenticate(email: string, password: string) {
    const result = await this.pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM administrators WHERE email = $1',
      [email.trim().toLowerCase()],
    );
    const hash = result.rows[0]?.password_hash;
    // Même dérivation pour un compte absent, afin de limiter les différences de temps.
    const valid = await verifyPassword(
      password,
      hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`,
    );
    return Boolean(hash && valid);
  }
  close() {
    return this.pool.end();
  }
}
