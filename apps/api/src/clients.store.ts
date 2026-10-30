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
  async write(
    client: Client,
    image?: UploadedImage,
    creating = false,
    galleryPhotos: { image: UploadedImage; alt: string }[] = [],
    galleryReplacements: (UploadedImage | undefined)[] = [],
  ) {
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
      for (const [index, replacement] of galleryReplacements.entries()) {
        if (!replacement || !client.gallery[index]) continue;
        const id = randomUUID();
        await connection.query('INSERT INTO images VALUES ($1, $2, $3)', [
          id,
          replacement.mime,
          Buffer.from(replacement.content),
        ]);
        client = {
          ...client,
          gallery: client.gallery.map((photo, position) =>
            position === index
              ? { ...photo, image: `/api/v1/client-images/${id}` }
              : photo,
          ),
        };
      }
      for (const galleryPhoto of galleryPhotos) {
        const id = randomUUID();
        await connection.query('INSERT INTO images VALUES ($1, $2, $3)', [
          id,
          galleryPhoto.image.mime,
          Buffer.from(galleryPhoto.image.content),
        ]);
        client = {
          ...client,
          gallery: [
            ...client.gallery,
            { image: `/api/v1/client-images/${id}`, alt: galleryPhoto.alt },
          ],
        };
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
  async reorder(slugs: string[]) {
    return this.database.transaction(async (connection) => {
      const existing = await connection.query<{ slug: string }>(
        'SELECT slug FROM clients FOR UPDATE',
      );
      if (
        slugs.length !== existing.rows.length ||
        new Set(slugs).size !== slugs.length ||
        existing.rows.some((row) => !slugs.includes(row.slug))
      )
        return false;
      for (const [position, slug] of slugs.entries()) {
        await connection.query(
          "UPDATE clients SET content = jsonb_set(content, '{position}', to_jsonb($2::integer)) WHERE slug = $1",
          [slug, position],
        );
      }
      await connection.query(
        "INSERT INTO migrations VALUES ('postgres-edited') ON CONFLICT DO NOTHING",
      );
      return true;
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
        AND (content->>'image' = '/api/v1/client-images/' || images.id
          OR EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(content->'gallery', '[]'::jsonb)) photo
            WHERE photo->>'image' = '/api/v1/client-images/' || images.id))
      ))`,
      [id, admin],
    );
    return result.rows[0];
  }
}
export async function removeUnusedImages(connection: PoolClient) {
  await connection.query(`DELETE FROM images WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE content->>'image' = '/api/v1/client-images/' || images.id
      OR EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(content->'gallery', '[]'::jsonb)) photo
        WHERE photo->>'image' = '/api/v1/client-images/' || images.id)
  ) AND NOT EXISTS (
    SELECT 1 FROM offers WHERE content->>'image' = '/api/v1/offer-images/' || images.id
  )`);
}
