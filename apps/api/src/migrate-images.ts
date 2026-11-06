import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { Database } from './database';
import { importProjectOriginals } from './project-originals';
import { existsSync } from 'node:fs';

export async function purgeLegacy(database: Database) {
  if (!database.images.storage)
    throw new Error('MEDIA_STORAGE=s3 est obligatoire.');
  const rows = await database.pool.query<{ id: string }>(
    'SELECT id FROM images WHERE storage_key IS NOT NULL AND content IS NOT NULL',
  );
  for (const { id } of rows.rows) {
    await database.transaction(async (connection) => {
      const result = await connection.query(
        'SELECT * FROM images WHERE id=$1 FOR UPDATE',
        [id],
      );
      const row = result.rows[0];
      if (!row?.content || !row.storage_key) return;
      const copy = await database.images.storage!.get(row.storage_key);
      const hash = (content: Uint8Array) =>
        createHash('sha256').update(content).digest('hex');
      if (hash(copy) !== hash(row.content))
        throw new Error('Copie S3 non conforme : source conservée.');
      await connection.query('UPDATE images SET content=NULL WHERE id=$1', [
        id,
      ]);
    });
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const database = new Database();
  try {
    await database.migrate({ provisionAdmin: false });
    if (process.argv.includes('--purge-legacy')) await purgeLegacy(database);
    else if (process.argv.includes('--cleanup'))
      await database.images.cleanup();
    else {
      if (!database.images.storage)
        throw new Error('MEDIA_STORAGE=s3 est obligatoire pour migrer.');
      await importProjectOriginals(
        database,
        existsSync('apps/web/public/images/vitrine')
          ? 'apps/web/public/images/vitrine'
          : 'dist/apps/web/client/images/vitrine',
      );
      await database.images.migrateLegacy();
    }
    console.info(
      'Traitement des images terminé. Les références sont conservées.',
    );
  } catch {
    console.error(
      'Traitement des images interrompu. Les données historiques non validées sont conservées ; vérifiez les accès et relancez.',
    );
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}
