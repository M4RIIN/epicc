import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { vitrineProjects } from '@epicc/content-contracts';
import type { Database } from './database';

const digest = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');

/** Lecture seule : aucun contenu éditorial ni identifiant de connexion journalisé. */
export async function inventoryProjectMedia(database: Database) {
  const tables = ['clients', 'offers', 'project_images'] as const;
  const contents = {} as Record<
    (typeof tables)[number],
    { count: number; sha256: string }
  >;
  for (const table of tables) {
    const exists = await database.pool.query('SELECT to_regclass($1) AS name', [
      table,
    ]);
    const rows = exists.rows[0].name
      ? await database.pool.query(
          `SELECT content FROM ${table} ORDER BY content::text`,
        )
      : { rows: [], rowCount: 0 };
    contents[table] = {
      count: rows.rowCount ?? 0,
      sha256: digest(JSON.stringify(rows.rows)),
    };
  }
  const imageTable = await database.pool.query(
    "SELECT to_regclass('images') AS name",
  );
  const images = imageTable.rows[0].name
    ? await database.pool.query(`SELECT count(*)::int AS total,
    count(storage_key)::int AS in_bucket, count(content)::int AS with_source FROM images`)
    : { rows: [{ total: 0, in_bucket: 0, with_source: 0 }] };
  const originalTable = await database.pool.query(
    "SELECT to_regclass('project_originals') AS name",
  );
  const originals = originalTable.rows[0].name
    ? ((
        await database.pool.query(
          'SELECT count(*)::int AS count FROM project_originals',
        )
      ).rows[0].count as number)
    : 0;
  return { contents, images: images.rows[0], originals };
}

export async function verifyProjectMedia(database: Database, root: string) {
  if (!database.images.storage)
    throw new Error('La vérification exige le stockage S3.');
  const rows = await database.pool
    .query(`SELECT p.file, i.id, i.mime, i.storage_key,
    i.byte_size, i.sha256, i.width, i.height FROM project_originals p JOIN images i ON i.id=p.image_id`);
  const pieces = vitrineProjects.flatMap((project) => project.pieces);
  if (rows.rowCount !== pieces.length)
    throw new Error('Inventaire des originaux incomplet.');
  let bytes = 0;
  for (const piece of pieces) {
    const row = rows.rows.find((row) => row.file === piece.file);
    if (!row?.storage_key) throw new Error('Original absent du bucket.');
    const source = await readFile(resolve(root, `projets-${piece.file}`));
    const metadata = await sharp(source).metadata();
    const copy = await database.images.storage.get(row.storage_key);
    const hash = digest(source);
    if (
      digest(copy) !== hash ||
      row.sha256 !== hash ||
      Number(row.byte_size) !== source.byteLength ||
      row.width !== metadata.width ||
      row.height !== metadata.height ||
      row.mime !== (metadata.format === 'jpeg' ? 'image/jpeg' : 'image/png')
    ) {
      throw new Error(
        'Copie S3 ou métadonnées non conformes : sources conservées.',
      );
    }
    bytes += copy.byteLength;
  }
  return { verified: pieces.length, bytes, metadataValid: true };
}
