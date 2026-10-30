import { DatabaseSync } from 'node:sqlite';
import { clientSchema } from '@epicc/content-contracts';
import { pathToFileURL } from 'node:url';
import { Database } from './database';

// Import explicite avant démarrage du site ; la source SQLite est ouverte en lecture seule.
export async function importSqlite(database: Database, path: string) {
  const source = new DatabaseSync(path, { readOnly: true });
  try {
    const clients = source.prepare('SELECT slug, content FROM clients').all();
    const images = source.prepare('SELECT id, mime, content FROM images').all();
    await database.transaction(async (connection) => {
      await connection.query('SELECT pg_advisory_xact_lock(310031)');
      const imported = await connection.query(
        "SELECT id FROM migrations WHERE id = 'import-sqlite'",
      );
      if (imported.rowCount)
        throw new Error('Cette base a déjà reçu un import SQLite.');
      // Refuser de remplacer des modifications déjà réalisées sur PostgreSQL.
      const untouched = await connection.query(
        `SELECT id FROM migrations WHERE id = 'postgres-edited'`,
      );
      if (untouched.rowCount)
        throw new Error(
          'La base PostgreSQL a déjà été modifiée. Import refusé.',
        );
      await connection.query('DELETE FROM clients');
      for (const row of images) {
        await connection.query(
          'INSERT INTO images VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [row.id, row.mime, Buffer.from(row.content as Uint8Array)],
        );
      }
      for (const row of clients) {
        const client = clientSchema.parse(JSON.parse(row.content as string));
        if (client.slug !== row.slug)
          throw new Error('Adresse de fiche incohérente dans la source.');
        await connection.query('INSERT INTO clients VALUES ($1, $2)', [
          client.slug,
          client,
        ]);
      }
      await connection.query("INSERT INTO migrations VALUES ('import-sqlite')");
    });
  } finally {
    source.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const path = process.argv[2];
  if (!path)
    throw new Error('Indiquez le chemin de la base SQLite à importer.');
  const database = new Database();
  try {
    await database.migrate();
    await importSqlite(database, path);
    console.info(
      'Import des clients et images terminé. La source SQLite est conservée.',
    );
  } catch {
    console.error(
      'Import refusé ou impossible. Vérifiez la source et utilisez une base PostgreSQL neuve.',
    );
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}
