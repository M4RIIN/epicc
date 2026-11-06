import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { vitrineProjects } from '@epicc/content-contracts';
import type { Database } from './database';

/** Import idempotent des octets d’origine, sans redimensionnement. */
export async function importProjectOriginals(database: Database, root: string) {
  for (const piece of vitrineProjects.flatMap((project) => project.pieces)) {
    const existing = await database.pool.query(
      'SELECT 1 FROM project_originals WHERE file=$1',
      [piece.file],
    );
    if (existing.rowCount) continue;
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
          'INSERT INTO project_originals VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [piece.file, id],
        );
      },
    );
  }
}
