import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { vitrineAssetFiles } from '@epicc/content-contracts';
import type { Database } from './database';

/** Les fichiers du build ne servent qu’à initialiser/reprendre le stockage. */
export async function importVitrineOriginals(
  database: Database,
  imageRoot: string,
) {
  const report = { imported: 0, skipped: 0 };
  const lock = await database.pool.connect();
  try {
    await lock.query('SELECT pg_advisory_lock(310035)');
    for (const file of vitrineAssetFiles) {
      if (
        (
          await database.pool.query(
            'SELECT 1 FROM vitrine_originals WHERE file=$1',
            [file],
          )
        ).rowCount
      ) {
        report.skipped++;
        continue;
      }
      const source = file.startsWith('viandes-des-sommets/')
        ? file
        : `vitrine/${file}`;
      const content = await readFile(resolve(imageRoot, source));
      const metadata = await sharp(content).metadata();
      const mime = file.endsWith('.svg')
        ? 'image/svg+xml'
        : metadata.format === 'jpeg'
          ? 'image/jpeg'
          : metadata.format === 'webp'
            ? 'image/webp'
            : 'image/png';
      const id = randomUUID();
      await database.images.write(
        id,
        { content, mime, width: metadata.width, height: metadata.height },
        async (connection) => {
          await connection.query(
            'INSERT INTO vitrine_originals VALUES ($1,$2)',
            [file, id],
          );
        },
        { pruneUnused: false },
      );
      report.imported++;
    }
    return report;
  } finally {
    try {
      await lock.query('SELECT pg_advisory_unlock(310035)');
    } finally {
      lock.release();
    }
  }
}
