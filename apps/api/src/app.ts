import { Hono } from 'hono';
import { StorageUnavailable, ImageReferenceChanged } from './images.store';
import { secureHeaders } from 'hono/secure-headers';
import {
  GetPublishedPage,
  PageNotFoundError,
} from '@epicc/content-application';
import type { PageRepository } from '@epicc/content-application';
import type { PublishedPage } from '@epicc/content-contracts';

export function createApi(pages: PageRepository) {
  const api = new Hono();
  const getPublishedPage = new GetPublishedPage(pages);

  api.use('*', secureHeaders());
  api.get('/health', (context) => context.json({ status: 'ok' }));
  api.get('/v1/pages/:slug', async (context) => {
    const page = await getPublishedPage.execute(context.req.param('slug'));
    const response: PublishedPage = {
      slug: page.slug,
      title: page.title,
      description: page.description,
      body: page.body,
    };
    return context.json(response);
  });
  api.notFound((context) =>
    context.json({ error: 'Ressource introuvable.' }, 404),
  );
  api.onError((error, context) => {
    if (error instanceof PageNotFoundError) {
      return context.json({ error: error.message }, 404);
    }
    if (error instanceof ImageReferenceChanged) {
      return context.json({ error: error.message }, 409);
    }
    if (error instanceof StorageUnavailable) {
      context.header('Cache-Control', 'no-store');
      return context.json({ error: error.message }, 503);
    }
    console.error('Erreur interne de l’API.');
    return context.json({ error: 'Une erreur interne est survenue.' }, 500);
  });
  return api;
}
