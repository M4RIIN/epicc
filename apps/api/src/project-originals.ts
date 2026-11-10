import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import {
  vitrineProjects,
  canonicalLogo,
  logoAlias,
} from '@epicc/content-contracts';
import type { Database } from './database';

/** Import idempotent des octets d’origine, sans redimensionnement. */
export async function importProjectOriginals(database: Database, root: string) {
  const report = { imported: 0, skipped: 0, conflicts: 0 };
  const lock = await database.pool.connect();
  try {
    await lock.query('SELECT pg_advisory_lock(310034)');
    const edits = await lock.query(
      'SELECT content FROM project_images WHERE file = ANY($1)',
      [[canonicalLogo, logoAlias]],
    );
    const references = new Set(
      edits.rows.map((row) => row.content.image).filter(Boolean),
    );
    if (references.size > 1) {
      console.info(
        'IMPORT_ORIGINAUX',
        JSON.stringify({ ...report, conflicts: 1 }),
      );
      throw new Error(
        'Deux versions éditées du logo de L’Écluse Douze : sources conservées, choix nécessaire.',
      );
    }
    for (const piece of vitrineProjects.flatMap((project) => project.pieces)) {
      const existing = await database.pool.query(
        'SELECT 1 FROM project_originals WHERE file=$1',
        [piece.file],
      );
      const revision =
        piece.file === 'D8DV39.png' ? 'figma-411-3-amafolia' : null;
      const revised = revision
        ? (
            await database.pool.query('SELECT 1 FROM migrations WHERE id=$1', [
              revision,
            ])
          ).rowCount
        : true;
      if (existing.rowCount && revised) {
        report.skipped++;
        continue;
      }
      const content = await readFile(resolve(root, `projets-${piece.file}`));
      const metadata = await sharp(content).metadata();
      const mime = metadata.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const id = randomUUID();
      await database.images.write(
        id,
        { content, mime, width: metadata.width, height: metadata.height },
        async (connection) => {
          if (database.images.storage) {
            const copy = await database.images.storage.get(`media/${id}`);
            const hash = (bytes: Uint8Array) =>
              createHash('sha256').update(bytes).digest('hex');
            if (hash(copy) !== hash(content))
              throw new Error('Copie du visuel non conforme.');
          }
          await connection.query(
            'INSERT INTO project_originals VALUES ($1,$2) ON CONFLICT (file) DO UPDATE SET image_id=EXCLUDED.image_id',
            [piece.file, id],
          );
          if (revision)
            await connection.query(
              'INSERT INTO migrations VALUES ($1) ON CONFLICT DO NOTHING',
              [revision],
            );
        },
        { pruneUnused: false },
      );
      report.imported++;
    }
    console.info('IMPORT_ORIGINAUX', JSON.stringify(report));
    return report;
  } finally {
    try {
      await lock.query('SELECT pg_advisory_unlock(310034)');
    } finally {
      lock.release();
    }
  }
}
