import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  vitrineProjects,
  projectOriginalPieces,
} from '@epicc/content-contracts';
import { Database } from './database';
import { importProjectOriginals } from './project-originals';
import { migrateProjectMedia } from './migrate-images';
import {
  inventoryProjectMedia,
  verifyProjectMedia,
} from './project-media-audit';
import { createProjectsApi } from './projects.api';
import {
  initialOffers,
  previousOffers,
  previousVitrineOffers,
} from './offers.seed';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Utilitaire partagé uniquement entre tests PostgreSQL.
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from '../../../e2e/database';

let database: Database;
let name: string;
const objects = new Map<string, Uint8Array>();
const storage = {
  put: vi.fn(async (key: string, content: Uint8Array) => {
    objects.set(key, content);
  }),
  get: vi.fn(async (key: string) => {
    const content = objects.get(key);
    if (!content) throw new Error('Absent');
    return content;
  }),
  delete: vi.fn(async (key: string) => {
    objects.delete(key);
  }),
};
const root = 'apps/web/public/images/vitrine';
beforeEach(async () => {
  name = testDatabaseName('originals');
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name), storage);
  await database.migrate({ provisionAdmin: false });
});
afterEach(async () => {
  await database?.close();
  if (name) await manageTestDatabase(name, false);
  objects.clear();
  vi.restoreAllMocks();
});
it('importe les visuels du catalogue sans changer leurs octets, conserve leurs métadonnées et reprend sans doublon', async () => {
  expect(await importProjectOriginals(database, root)).toEqual({
    imported: projectOriginalPieces.length,
    skipped: 0,
    conflicts: 0,
  });
  expect(objects.size).toBe(projectOriginalPieces.length);
  expect(await importProjectOriginals(database, root)).toEqual({
    imported: 0,
    skipped: projectOriginalPieces.length,
    conflicts: 0,
  });
  expect(objects.size).toBe(projectOriginalPieces.length);
  expect(await verifyProjectMedia(database, root)).toMatchObject({
    verified: projectOriginalPieces.length,
    metadataValid: true,
  });
  const rows = await database.pool.query('SELECT * FROM images');
  expect(rows.rowCount).toBe(projectOriginalPieces.length);
  expect(
    rows.rows.every(
      (row) =>
        !row.content &&
        row.storage_key &&
        row.sha256 &&
        row.width &&
        row.height &&
        Number(row.byte_size) > 0,
    ),
  ).toBe(true);
  const api = createProjectsApi(database);
  const images = await (await api.request('/v1/project-images')).json();
  for (const piece of vitrineProjects.flatMap((item) => item.pieces)) {
    const image = images.find(
      (item: { file: string }) => item.file === piece.file,
    );
    expect(image.image).toMatch(/^\/api\/v1\/project-images\//);
    const response = await api.request(image.image.replace('/api', ''));
    const hash = (bytes: Uint8Array) =>
      createHash('sha256').update(bytes).digest('hex');
    expect(hash(new Uint8Array(await response.arrayBuffer()))).toBe(
      hash(await readFile(`${root}/projets-${piece.file}`)),
    );
  }
  // Une autre édition ne doit jamais nettoyer les originaux, nécessaires à la restauration.
  await database.images.write(null, undefined, async (connection) => {
    await connection.query('DELETE FROM clients');
  });
  expect(objects.size).toBe(projectOriginalPieces.length);
}, 60000);

it('refuse une modification des contenus pendant la migration des médias', async () => {
  vi.spyOn(database.images, 'migrateLegacy').mockImplementationOnce(
    async () => {
      await database.pool.query('INSERT INTO project_images VALUES ($1,$2)', [
        'Rectangle5.png',
        { file: 'Rectangle5.png', image: null, alt: 'Modification inattendue' },
      ]);
    },
  );
  await expect(migrateProjectMedia(database, root)).rejects.toThrow(
    'Les contenus ont changé pendant l’import',
  );
}, 60000);
it('conserve la source et ne publie pas une copie S3 non conforme', async () => {
  storage.get.mockResolvedValueOnce(new Uint8Array([0]));
  await expect(importProjectOriginals(database, root)).rejects.toThrow(
    'non conforme',
  );
  expect(
    (await database.pool.query('SELECT * FROM project_originals')).rowCount,
  ).toBe(0);
  expect((await database.pool.query('SELECT * FROM images')).rowCount).toBe(0);
  // Seul l’objet de cette tentative est réservé pour un nettoyage différé.
  expect(objects.size).toBe(1);
  await database.images.cleanup();
  expect(objects.size).toBe(0);
  await importProjectOriginals(database, root);
  expect(objects.size).toBe(projectOriginalPieces.length);
}, 60000);

it('préserve les éditions et les images historiques non référencées pendant l’import', async () => {
  await database.pool.query(
    "INSERT INTO images(id,mime,content) VALUES ('00000000-0000-0000-0000-000000000001','image/png',$1)",
    [Buffer.from('source historique de test')],
  );
  await database.pool.query('INSERT INTO project_images VALUES ($1,$2)', [
    'Rectangle5.png',
    { file: 'Rectangle5.png', image: null, alt: 'Texte édité conservé' },
  ]);
  const before = await inventoryProjectMedia(database);
  await importProjectOriginals(database, root);
  const after = await inventoryProjectMedia(database);
  expect(after.contents).toEqual(before.contents);
  expect(after.images).toEqual({
    total: projectOriginalPieces.length + 1,
    in_bucket: projectOriginalPieces.length,
    with_source: 1,
  });
}, 60000);
it('arrête l’import avant toute écriture en cas de logos édités contradictoires', async () => {
  for (const [index, file] of [
    'CaptureDecran20261029A153342121.png',
    'CaptureDecran20261029A153342111.png',
  ].entries()) {
    await database.pool.query('INSERT INTO project_images VALUES ($1,$2)', [
      file,
      {
        file,
        image: `/api/v1/project-images/00000000-0000-0000-0000-00000000000${index + 1}`,
        alt: 'Logo édité de test',
      },
    ]);
  }
  const before = await inventoryProjectMedia(database);
  await expect(importProjectOriginals(database, root)).rejects.toThrow(
    'Deux versions éditées',
  );
  expect(await inventoryProjectMedia(database)).toEqual(before);
  expect(objects.size).toBe(0);
});

it('initialise une base vierge et reprend la migration complète sans doublon', async () => {
  await database.close();
  await manageTestDatabase(name, false);
  await manageTestDatabase(name, true);
  database = new Database(testDatabaseUrl(name), storage);
  expect(await migrateProjectMedia(database, root)).toMatchObject({
    imported: projectOriginalPieces.length,
    skipped: 0,
    conflicts: 0,
    verified: projectOriginalPieces.length,
    metadataValid: true,
    editedContentsPreserved: true,
  });
  expect(await migrateProjectMedia(database, root)).toMatchObject({
    imported: 0,
    skipped: projectOriginalPieces.length,
    conflicts: 0,
    verified: projectOriginalPieces.length,
  });
  expect(objects.size).toBe(projectOriginalPieces.length);
}, 60000);

it('migre les anciennes offres avant de contrôler la préservation des contenus pendant l’import', async () => {
  await database.pool.query('DELETE FROM offers');
  for (const offer of previousOffers) {
    await database.pool.query('INSERT INTO offers VALUES ($1,$2)', [
      offer.slug,
      offer,
    ]);
  }
  const editedOffer = {
    ...previousOffers[0],
    description: 'Description personnalisée de test à conserver',
  };
  await database.pool.query('UPDATE offers SET content=$2 WHERE slug=$1', [
    editedOffer.slug,
    editedOffer,
  ]);
  await database.pool.query(
    "DELETE FROM migrations WHERE id='vitrine-offers-2026-11'",
  );

  expect(await migrateProjectMedia(database, root)).toMatchObject({
    imported: projectOriginalPieces.length,
    editedContentsPreserved: true,
    verified: projectOriginalPieces.length,
  });
  const offers = await database.pool.query('SELECT content FROM offers');
  expect(offers.rows.map((row) => row.content)).toEqual(
    expect.arrayContaining([
      editedOffer,
      initialOffers.find((offer) => offer.slug === 'reseaux-sociaux'),
      initialOffers.find((offer) => offer.slug === 'graphisme'),
    ]),
  );
  const migrated = await inventoryProjectMedia(database);
  expect(await migrateProjectMedia(database, root)).toMatchObject({
    imported: 0,
    skipped: projectOriginalPieces.length,
    editedContentsPreserved: true,
  });
  expect(await inventoryProjectMedia(database)).toEqual(migrated);
}, 60000);

it('renouvelle le visuel Amafolia par défaut sans perdre une image administrée', async () => {
  await importProjectOriginals(database, root);
  const previous = (
    await database.pool.query(
      "SELECT image_id FROM project_originals WHERE file='Rectangle5.png'",
    )
  ).rows[0].image_id;
  const custom = {
    file: 'D8DV39.png',
    image: `/api/v1/project-images/${previous}`,
    alt: 'Image personnalisée conservée',
  };
  await database.pool.query(
    "UPDATE project_originals SET image_id=$1 WHERE file='D8DV39.png'",
    [previous],
  );
  await database.pool.query(
    "DELETE FROM migrations WHERE id='figma-411-3-amafolia'",
  );
  await database.pool.query('INSERT INTO project_images VALUES ($1,$2)', [
    'D8DV39.png',
    custom,
  ]);
  expect(await importProjectOriginals(database, root)).toMatchObject({
    imported: 1,
    skipped: projectOriginalPieces.length - 1,
  });
  const original = (
    await database.pool.query(
      "SELECT image_id FROM project_originals WHERE file='D8DV39.png'",
    )
  ).rows[0].image_id;
  expect(original).not.toBe(previous);
  expect(
    (
      await database.pool.query(
        "SELECT content FROM project_images WHERE file='D8DV39.png'",
      )
    ).rows[0].content,
  ).toEqual(custom);
  expect(await verifyProjectMedia(database, root)).toMatchObject({
    verified: projectOriginalPieces.length,
    metadataValid: true,
  });
  expect(await importProjectOriginals(database, root)).toMatchObject({
    imported: 0,
    skipped: projectOriginalPieces.length,
  });
}, 60000);

it('actualise les offres d’origine sans écraser les textes et l’ordre personnalisés', async () => {
  await database.pool.query(
    "DELETE FROM migrations WHERE id='vitrine-novembre-2026-v2'",
  );
  const custom = {
    ...previousVitrineOffers[1]!,
    summary: 'Présentation personnalisée',
    position: 8,
  };
  for (const offer of previousVitrineOffers)
    await database.pool.query('UPDATE offers SET content=$2 WHERE slug=$1', [
      offer.slug,
      offer.slug === custom.slug ? custom : offer,
    ]);
  await database.migrate({ provisionAdmin: false });
  const after = (
    await database.pool.query('SELECT content FROM offers ORDER BY slug')
  ).rows.map((row) => row.content);
  expect(after.find((offer) => offer.slug === custom.slug)).toEqual(custom);
  for (const offer of initialOffers.filter(
    (offer) => offer.slug !== custom.slug,
  ))
    expect(after.find((item) => item.slug === offer.slug)).toEqual(offer);
  await database.migrate({ provisionAdmin: false });
  expect(
    (
      await database.pool.query('SELECT content FROM offers ORDER BY slug')
    ).rows.map((row) => row.content),
  ).toEqual(after);
});
