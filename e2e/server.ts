import { manageTestDatabase, testDatabaseUrl } from './database';
// Préparation explicite des fixtures du serveur de test.
import { Database } from '../apps/api/src/database';

const name = process.env.EPICC_E2E_DATABASE!;
await manageTestDatabase(name, true);
// Le serveur ferme ses connexions sur SIGTERM ; la base est ensuite supprimée.
process.once('beforeExit', async () => {
  await manageTestDatabase(name, false);
});
try {
  const fixtures = new Database(testDatabaseUrl(name));
  try {
    await fixtures.migrate();
    // Conserver uniquement les données fictives dans les tests, sans les références du site.
    await fixtures.pool.query(
      "INSERT INTO migrations VALUES ('reference-projects-v1')",
    );
  } finally {
    await fixtures.close();
  }
  const server = new URL('../dist/apps/api/main.mjs', import.meta.url);
  await import(server.href);
} catch {
  process.exitCode = 1;
  console.error('Démarrage du serveur de test impossible.');
}
