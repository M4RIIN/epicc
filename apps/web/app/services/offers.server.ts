import { offerSchema } from '@epicc/content-contracts';
import { clientsRequest } from './clients.server';

export async function loadOffers() {
  const response = await clientsRequest('offers');
  if (!response.ok)
    throw new Response('Les offres sont temporairement indisponibles.', {
      status: 503,
    });
  return offerSchema.array().parse(await response.json());
}
