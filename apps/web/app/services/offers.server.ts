import { offerSchema } from '@epicc/content-contracts';
import { apiRequest } from './api.server';

export async function loadOffers() {
  const response = await apiRequest('offers');
  if (!response.ok)
    throw new Response('Les offres sont temporairement indisponibles.', {
      status: 503,
    });
  return offerSchema.array().parse(await response.json());
}
export async function saveOffer(slug: string, form: FormData) {
  const response = await apiRequest(
    `admin/offers/${encodeURIComponent(slug)}`,
    { method: 'POST', body: form },
    true,
  );
  if (response.ok) return null;
  if ([400, 404].includes(response.status)) {
    const result = (await response.json()) as { error?: string };
    return result.error ?? 'Offre introuvable.';
  }
  return 'Enregistrement impossible. Réessayez dans quelques instants.';
}
