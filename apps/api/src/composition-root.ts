import { Page } from '@epicc/content-domain';
import { InMemoryPageRepository } from '@epicc/content-infrastructure';
import { createApi } from './app';
import { ClientStore } from './clients.store';
import { createClientsApi } from './clients.api';
import { Database } from './database';
import { createOffersApi } from './offers.api';
import { createAuthApi } from './auth.api';

export function composeApi(database: Database) {
  const pages = new InMemoryPageRepository([
    new Page({
      slug: 'accueil',
      title: 'Des idées ambitieuses. Des projets qui prennent vie.',
      description:
        'EPICC accompagne vos projets avec une approche claire, créative et durable.',
      body: 'Nous croyons aux projets qui ont du sens. Un dialogue ouvert, une vision partagée et le souci du détail : voilà notre point de départ pour construire la suite avec vous.',
      published: true,
    }),
  ]);
  return createApi(pages)
    .route('/', createClientsApi(new ClientStore(database)))
    .route('/', createOffersApi(database))
    .route('/', createAuthApi(database));
}
