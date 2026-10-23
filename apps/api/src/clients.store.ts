import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { clientSchema } from '@epicc/content-contracts';
import type { Client } from '@epicc/content-contracts';
import { initialClients } from './clients.seed';

// Une connexion par processus ; SQLite sérialise les écritures et leur transaction.
export class ClientStore {
  private readonly db: DatabaseSync;

  constructor(path = process.env.CLIENTS_DB_PATH ?? 'data/clients.sqlite') {
    if (path !== ':memory:')
      mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS clients (slug TEXT PRIMARY KEY, content TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, content BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY);`);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (
        !this.db
          .prepare("SELECT id FROM migrations WHERE id = 'seed-clients'")
          .get()
      ) {
        for (const [position, client] of initialClients.entries()) {
          this.save({ ...client, published: true, position });
        }
        this.db
          .prepare('INSERT INTO migrations VALUES (?)')
          .run('seed-clients');
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  list(includeDrafts = false): Client[] {
    return this.db
      .prepare('SELECT content FROM clients')
      .all()
      .map((row) => clientSchema.parse(JSON.parse(row.content as string)))
      .filter((client) => includeDrafts || client.published)
      .sort((a, b) => a.position - b.position || a.slug.localeCompare(b.slug));
  }

  save(client: Client) {
    this.db
      .prepare(
        'INSERT INTO clients VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET content = excluded.content',
      )
      .run(client.slug, JSON.stringify(clientSchema.parse(client)));
  }

  write(client: Client, image?: { mime: string; content: Uint8Array }) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (image) {
        const id = randomUUID();
        this.db
          .prepare('INSERT INTO images VALUES (?, ?, ?)')
          .run(id, image.mime, image.content);
        client = { ...client, image: `/api/v1/client-images/${id}` };
      }
      this.save(client);
      this.removeUnusedImages();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  delete(slug: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM clients WHERE slug = ?').run(slug);
      this.removeUnusedImages();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private removeUnusedImages() {
    this.db.exec(`DELETE FROM images WHERE NOT EXISTS (
      SELECT 1 FROM clients WHERE json_extract(content, '$.image') = '/api/v1/client-images/' || images.id
    )`);
  }

  image(id: string, admin = false) {
    // Les images de brouillons ne sont jamais accessibles publiquement.
    return this.db
      .prepare(
        `SELECT images.mime, images.content FROM images WHERE id = ? AND (? = 1 OR EXISTS (
      SELECT 1 FROM clients WHERE json_extract(content, '$.published') = 1
      AND json_extract(content, '$.image') = '/api/v1/client-images/' || images.id
    ))`,
      )
      .get(id, admin ? 1 : 0) as
      { mime: string; content: Uint8Array } | undefined;
  }

  close() {
    this.db.close();
  }
}
