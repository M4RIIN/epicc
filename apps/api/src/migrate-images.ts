import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { Database } from './database';
import { importProjectOriginals } from './project-originals';
import { existsSync } from 'node:fs';
import {
  inventoryProjectMedia,
  verifyProjectMedia,
} from './project-media-audit';

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
export async function migrateProjectMedia(database: Database, root: string) {
  if (!database.images.storage)
    throw new Error('MEDIA_STORAGE=s3 est obligatoire pour migrer.');
  const before = await inventoryProjectMedia(database);
  console.info('INVENTAIRE_MEDIAS', JSON.stringify(before));
  await database.migrate({ provisionAdmin: false });
  const report = await importProjectOriginals(database, root);
  await database.images.migrateLegacy();
  const after = await inventoryProjectMedia(database);
  // Une base vierge reçoit les données initiales ; seules les données déjà
  // présentes avant la migration doivent rester strictement identiques.
  const preserved = (
    Object.keys(before.contents) as (keyof typeof before.contents)[]
  ).every(
    (table) =>
      before.contents[table].count === 0 ||
      before.contents[table].sha256 === after.contents[table].sha256,
  );
  if (!preserved)
    throw new Error(
      'Les contenus ont changé pendant l’import : vérification nécessaire.',
    );
  const verification = {
    ...(await verifyProjectMedia(database, root)),
    editedContentsPreserved: true,
  };
  console.info('VERIFICATION_MEDIAS', JSON.stringify(verification));
  return { ...report, ...verification };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const database = new Database();
  try {
    const root = existsSync('apps/web/public/images/vitrine')
      ? 'apps/web/public/images/vitrine'
      : 'dist/apps/web/client/images/vitrine';
    if (process.argv.includes('--inventory')) {
      console.info(
        'INVENTAIRE_MEDIAS',
        JSON.stringify(await inventoryProjectMedia(database)),
      );
    } else if (process.argv.includes('--verify')) {
      console.info(
        'VERIFICATION_MEDIAS',
        JSON.stringify(await verifyProjectMedia(database, root)),
      );
    } else if (
      process.argv.includes('--purge-legacy') ||
      process.argv.includes('--cleanup')
    ) {
      await database.migrate({ provisionAdmin: false });
      if (process.argv.includes('--purge-legacy')) await purgeLegacy(database);
      else await database.images.cleanup();
    } else await migrateProjectMedia(database, root);
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
