import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { PoolClient } from 'pg';
import type { Database } from './database';
import type { ObjectStorage } from './object-storage';

export type UploadedImage = {
  mime: string;
  content: Uint8Array;
  width?: number;
  height?: number;
};
export class StorageUnavailable extends Error {
  constructor() {
    super('Le stockage des images est temporairement indisponible. Réessayez.');
  }
}
export class ImageReferenceChanged extends Error {
  constructor() {
    super('Cette image a été modifiée. Rechargez la page avant de réessayer.');
  }
}
export async function assertImageReference(
  connection: PoolClient,
  reference: string | null,
) {
  if (!reference?.startsWith('/api/v1/')) return;
  const id = reference.split('/').at(-1);
  if (
    !(await connection.query('SELECT 1 FROM images WHERE id = $1', [id]))
      .rowCount
  )
    throw new ImageReferenceChanged();
}
export const unusedImages = `NOT EXISTS (
  SELECT 1 FROM clients WHERE content->>'image' = '/api/v1/client-images/' || images.id
) AND NOT EXISTS (
  SELECT 1 FROM offers WHERE content->>'image' = '/api/v1/offer-images/' || images.id
) AND NOT EXISTS (
  SELECT 1 FROM project_images WHERE content->>'image' = '/api/v1/project-images/' || images.id
)`;
export async function removeUnusedImages(connection: PoolClient) {
  await connection.query(`INSERT INTO media_deletions (storage_key)
    SELECT storage_key FROM images WHERE storage_key IS NOT NULL AND ${unusedImages}
    ON CONFLICT DO NOTHING`);
  await connection.query(`DELETE FROM images WHERE ${unusedImages}`);
}

export class ImageStore {
  constructor(
    readonly database: Database,
    readonly storage?: ObjectStorage,
  ) {}

  private async reserve(key: string) {
    // Durable avant le PUT : même un arrêt brutal laisse une tâche de nettoyage.
    await this.database.pool.query(
      `INSERT INTO media_deletions (storage_key, available_at)
      VALUES ($1, now() + interval '1 hour') ON CONFLICT (storage_key)
      DO UPDATE SET available_at = EXCLUDED.available_at`,
      [key],
    );
  }
  async write<T>(
    id: string | null,
    image: UploadedImage | undefined,
    work: (connection: PoolClient) => Promise<T>,
  ) {
    const key = image && id && this.storage ? `media/${id}` : null;
    if (key) await this.reserve(key);
    try {
      if (key && image) {
        try {
          await this.storage!.put(key, image.content, image.mime);
        } catch {
          throw new StorageUnavailable();
        }
      }
      const result = await this.database.transaction(async (connection) => {
        await connection.query("SET LOCAL lock_timeout = '10s'");
        await connection.query('SELECT pg_advisory_xact_lock(310032)');
        if (image && id) {
          await connection.query(
            `INSERT INTO images
            (id, mime, content, storage_key, byte_size, width, height, sha256)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              id,
              image.mime,
              key ? null : Buffer.from(image.content),
              key,
              image.content.byteLength,
              image.width ?? null,
              image.height ?? null,
              createHash('sha256').update(image.content).digest('hex'),
            ],
          );
        }
        const value = await work(connection);
        if (key)
          await connection.query(
            'DELETE FROM media_deletions WHERE storage_key = $1',
            [key],
          );
        await removeUnusedImages(connection);
        return value;
      });
      await this.cleanup();
      return result;
    } catch (error) {
      // La référence précédente reste intacte si le PUT ou la transaction échoue.
      if (key) {
        await this.database.pool.query(
          'UPDATE media_deletions SET available_at = now() WHERE storage_key = $1',
          [key],
        );
        await this.cleanup();
      }
      throw error;
    }
  }
  async read(row: {
    mime: string;
    content: Buffer | null;
    storage_key: string | null;
  }) {
    if (!row.storage_key) return { mime: row.mime, content: row.content! };
    try {
      if (!this.storage) throw new StorageUnavailable();
      return {
        mime: row.mime,
        content: await this.storage.get(row.storage_key),
      };
    } catch {
      throw new StorageUnavailable();
    }
  }
  async cleanup() {
    if (!this.storage) return;
    try {
      // Verrouillage des tâches : plusieurs réplicas peuvent nettoyer sans course.
      await this.database.transaction(async (connection) => {
        const jobs = await connection.query<{
          storage_key: string;
        }>(`SELECT storage_key
          FROM media_deletions WHERE available_at <= now()
          ORDER BY available_at LIMIT 20 FOR UPDATE SKIP LOCKED`);
        for (const { storage_key: key } of jobs.rows) {
          const used = await connection.query(
            'SELECT 1 FROM images WHERE storage_key = $1',
            [key],
          );
          if (!used.rowCount) await this.storage!.delete(key);
          await connection.query(
            'DELETE FROM media_deletions WHERE storage_key = $1',
            [key],
          );
        }
      });
    } catch {
      // Ne pas masquer un enregistrement réussi ; la file sera reprise au prochain passage.
      console.error(
        'Nettoyage S3 différé : la file persistante sera réessayée.',
      );
    }
  }

  async migrateLegacy() {
    if (!this.storage)
      throw new Error('MEDIA_STORAGE=s3 est obligatoire pour migrer.');
    const ids = await this.database.pool.query<{ id: string }>(
      'SELECT id FROM images WHERE storage_key IS NULL ORDER BY id',
    );
    for (const { id } of ids.rows) {
      const key = `media/${id}`;
      await this.reserve(key);
      await this.database.transaction(async (connection) => {
        await connection.query("SET LOCAL lock_timeout = '10s'");
        const result = await connection.query(
          'SELECT * FROM images WHERE id = $1 FOR UPDATE',
          [id],
        );
        const row = result.rows[0];
        if (!row || row.storage_key) return;
        await this.storage!.put(key, row.content, row.mime);
        const copy = await this.storage!.get(key);
        const metadata = await sharp(row.content, {
          limitInputPixels: 40_000_000,
        }).metadata();
        const digest = createHash('sha256').update(row.content).digest('hex');
        if (createHash('sha256').update(copy).digest('hex') !== digest)
          throw new Error('La vérification de la copie S3 a échoué.');
        // Les octets historiques sont conservés jusqu’à validation explicite.
        await connection.query(
          `UPDATE images SET storage_key=$2, byte_size=$3, sha256=$4, width=$5, height=$6 WHERE id=$1`,
          [id, key, copy.byteLength, digest, metadata.width, metadata.height],
        );
        await connection.query(
          'DELETE FROM media_deletions WHERE storage_key=$1',
          [key],
        );
      });
    }
  }
}
