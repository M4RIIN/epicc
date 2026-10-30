import { Pool, type PoolClient } from 'pg';
import { randomBytes, scrypt as deriveKey, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { initialClients } from './clients.seed';
import { initialOffers } from './offers.seed';

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
  constructor(url = process.env.DATABASE_URL) {
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
  async migrate() {
    await this.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(310031)');
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS clients (slug TEXT PRIMARY KEY, content JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS images (id UUID PRIMARY KEY, mime TEXT NOT NULL, content BYTEA NOT NULL);
        CREATE TABLE IF NOT EXISTS offers (slug TEXT PRIMARY KEY, content JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS administrators (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
      `);
      if (
        !(
          await client.query(
            "SELECT id FROM migrations WHERE id = 'seed-clients'",
          )
        ).rowCount
      ) {
        for (const [position, item] of initialClients.entries()) {
          await client.query(
            'INSERT INTO clients VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [item.slug, { ...item, published: true, position }],
          );
        }
        await client.query("INSERT INTO migrations VALUES ('seed-clients')");
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
      // Les variables servent uniquement à créer le compte initial ; aucun mot de passe en clair en base.
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
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
