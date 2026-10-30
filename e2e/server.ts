import { manageTestDatabase } from './database';

const name = process.env.EPICC_E2E_DATABASE!;
await manageTestDatabase(name, true);
// Le serveur ferme ses connexions sur SIGTERM ; la base est ensuite supprimée.
process.once('beforeExit', async () => {
  await manageTestDatabase(name, false);
});
try {
  const server = new URL('../dist/apps/api/main.mjs', import.meta.url);
  await import(server.href);
} catch {
  process.exitCode = 1;
  console.error('Démarrage du serveur de test impossible.');
}
