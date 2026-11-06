import { randomUUID } from 'node:crypto';
import { clientSchema } from '@epicc/content-contracts';
import type { Client } from '@epicc/content-contracts';
import { Database } from './database';

import { assertImageReference, type UploadedImage } from './images.store';
export type { UploadedImage } from './images.store';
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
    const id = image ? randomUUID() : null;
    await this.database.images.write(id, image, async (connection) => {
      if (id) client = { ...client, image: `/api/v1/client-images/${id}` };
      const content = clientSchema.parse(client);
      await assertImageReference(connection, content.image);
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
    });
  }
  async delete(slug: string) {
    await this.database.images.write(null, undefined, async (connection) => {
      await connection.query('DELETE FROM clients WHERE slug = $1', [slug]);
      await connection.query(
        "INSERT INTO migrations VALUES ('postgres-edited') ON CONFLICT DO NOTHING",
      );
    });
  }
  async image(id: string, admin = false) {
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))
      return undefined;
    const result = await this.database.pool.query<{
      mime: string;
      content: Buffer | null;
      storage_key: string | null;
    }>(
      `SELECT mime, content, storage_key FROM images WHERE id = $1 AND ($2 OR EXISTS (
        SELECT 1 FROM clients WHERE (content->>'published')::boolean
        AND content->>'image' = '/api/v1/client-images/' || images.id
      ))`,
      [id, admin],
    );
    return result.rows[0]
      ? this.database.images.read(result.rows[0])
      : undefined;
  }
}
