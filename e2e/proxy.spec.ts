import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer, request as forward } from 'node:http';
import {
  manageTestDatabase,
  testDatabaseName,
  testDatabaseUrl,
} from './database';

test('connexion et modification derrière un proxy qui réécrit l’hôte, avec et sans JavaScript', async ({
  browser,
}) => {
  test.setTimeout(90000);
  const database = testDatabaseName('proxy');
  await manageTestDatabase(database, true);
  const server = spawn(process.execPath, ['dist/apps/api/main.mjs'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: testDatabaseUrl(database),
      PORT: '3188',
      INTERNAL_API_ORIGIN: 'http://127.0.0.1:3188',
      PUBLIC_SITE_URL: '',
      SESSION_SECRET:
        'secret-de-test-proxy-avec-plus-de-trente-deux-caracteres',
      ADMIN_EMAIL: 'test@questboard.test',
      ADMIN_PASSWORD: 'testtest',
    },
    stdio: 'ignore',
  });
  const proxy = createServer((incoming, outgoing) => {
    const upstream = forward(
      `http://127.0.0.1:3188${incoming.url}`,
      {
        method: incoming.method,
        headers: { ...incoming.headers, host: '127.0.0.1:3188' },
      },
      (response) => {
        outgoing.writeHead(response.statusCode!, response.headers);
        response.pipe(outgoing);
      },
    );
    upstream.on('error', () => {
      outgoing.writeHead(502);
      outgoing.end();
    });
    incoming.pipe(upstream);
  });
  try {
    await expect
      .poll(async () => {
        try {
          return (await fetch('http://127.0.0.1:3188/api/health')).status;
        } catch {
          return 0;
        }
      })
      .toBe(200);
    proxy.listen(3189, '127.0.0.1');
    await once(proxy, 'listening');
    for (const javaScriptEnabled of [false, true]) {
      const context = await browser.newContext({ javaScriptEnabled });
      try {
        const page = await context.newPage();
        await page.goto('http://127.0.0.1:3189/connect');
        await page.getByLabel('Adresse e-mail').fill('test@questboard.test');
        await page.getByLabel('Mot de passe', { exact: true }).fill('testtest');
        await page.getByRole('button', { name: 'Se connecter' }).click();
        await expect(
          page.getByRole('heading', { name: 'Gérer les clients' }),
        ).toBeVisible();
        await page
          .getByRole('link', {
            name: 'Modifier l’image 1 de Viande des Sorgues',
          })
          .click();
        await page
          .getByLabel('Texte alternatif de l’image')
          .fill('Visuel du projet derrière le proxy');
        await page.getByRole('button', { name: 'Enregistrer l’image' }).click();
        await expect(page).toHaveURL(
          'http://127.0.0.1:3189/connect#project-images',
        );
        expect(
          (
            await context.request.post(
              'http://127.0.0.1:3189/connect/projets/Rectangle5.png',
              {
                headers: { Origin: 'http://127.0.0.1:3189' },
                form: { alt: 'Sans jeton' },
              },
            )
          ).status(),
        ).toBe(400);
        await page.getByRole('button', { name: 'Se déconnecter' }).click();
        await expect(
          page.getByRole('heading', { name: 'Connexion à la gestion' }),
        ).toBeVisible();
      } finally {
        await context.close();
      }
    }
  } finally {
    proxy.closeAllConnections();
    if (proxy.listening)
      await new Promise<void>((resolve) => proxy.close(() => resolve()));
    const stopped = once(server, 'exit');
    server.kill('SIGTERM');
    await stopped;
    await manageTestDatabase(database, false);
  }
});
