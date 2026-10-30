import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { clientSchema } from '@epicc/content-contracts';
import type { Client } from '@epicc/content-contracts';
import { Database } from './database';

export type UploadedImage = { mime: string; content: Uint8Array };
export class ClientStore {
  constructor(readonly database: Database) {}
  async list(includeDrafts = false): Promise<Client[]> {
    const result = await this.database.pool.query(
      'SELECT content FROM clients',
    );
    return result.rows
      .map((row) => clientSchema.parse(row.content))
      .filter((client) => includeDrafts || client.published)
      .sort((a, b) => a.position - b.position || a.slug.localeCompare(b.slug));
  }
  async write(client: Client, image?: UploadedImage, creating = false) {
    await this.database.transaction(async (connection) => {
      if (image) {
        const id = randomUUID();
        await connection.query('INSERT INTO images VALUES ($1, $2, $3)', [
          id,
          image.mime,
          Buffer.from(image.content),
        ]);
        client = { ...client, image: `/api/v1/client-images/${id}` };
      }
      const content = clientSchema.parse(client);
      if (creating) {
        await connection.query('INSERT INTO clients VALUES ($1, $2)', [
          client.slug,
          content,
        ]);
      } else {
        await connection.query(
          'UPDATE clients SET content = $2 WHERE slug = $1',
          [client.slug, content],
        );
      }
      await connection.query(
        "INSERT INTO migrations VALUES ('postgres-edited') ON CONFLICT DO NOTHING",
      );
      await removeUnusedImages(connection);
    });
  }
  async delete(slug: string) {
    await this.database.transaction(async (connection) => {
      await connection.query('DELETE FROM clients WHERE slug = $1', [slug]);
      await connection.query(
        "INSERT INTO migrations VALUES ('postgres-edited') ON CONFLICT DO NOTHING",
      );
      await removeUnusedImages(connection);
    });
  }
  async image(id: string, admin = false) {
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return undefined;
    const result = await this.database.pool.query<{
      mime: string;
      content: Buffer;
    }>(
      `SELECT mime, content FROM images WHERE id = $1 AND ($2 OR EXISTS (
        SELECT 1 FROM clients WHERE (content->>'published')::boolean
        AND content->>'image' = '/api/v1/client-images/' || images.id
      ))`,
      [id, admin],
    );
    return result.rows[0];
  }
}
export async function removeUnusedImages(connection: PoolClient) {
  await connection.query(`DELETE FROM images WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE content->>'image' = '/api/v1/client-images/' || images.id
  ) AND NOT EXISTS (
    SELECT 1 FROM offers WHERE content->>'image' = '/api/v1/offer-images/' || images.id
  )`);
}
