import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';

// Réservé aux bases éphémères de test, sans accès au DATABASE_URL applicatif.
export function testDatabaseName(suffix: string) {
  const prefix = process.env.TEST_DB_PREFIX;
  if (
    !process.env.TEST_DATABASE_URL ||
    !prefix ||
    !/^[a-z][a-z0-9_]*_$/.test(prefix)
  ) {
    throw new Error(
      'TEST_DATABASE_URL et TEST_DB_PREFIX sont obligatoires pour les tests PostgreSQL.',
    );
  }
  return `${prefix}${suffix}_${randomUUID().replaceAll('-', '')}`;
}
export function testDatabaseUrl(name: string) {
  const base = process.env.TEST_DATABASE_URL;
  const prefix = process.env.TEST_DB_PREFIX;
  if (
    !base ||
    !prefix ||
    !name.startsWith(prefix) ||
    !/^[a-z][a-z0-9_]+$/.test(name)
  )
    throw new Error('Base de test non autorisée.');
  const url = new URL(base);
  url.pathname = `/${name}`;
  return url.href;
}
export async function manageTestDatabase(name: string, create: boolean) {
  testDatabaseUrl(name);
  const url = new URL(process.env.TEST_DATABASE_URL!);
  url.pathname = '/postgres';
  const pool = new Pool({ connectionString: url.href });
  try {
    await pool.query(
      create
        ? `CREATE DATABASE "${name}"`
        : `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`,
    );
  } finally {
    await pool.end();
  }
}
