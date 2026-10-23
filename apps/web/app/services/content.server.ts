import { publishedPageSchema } from '@epicc/content-contracts';

export async function loadHomePage(fetchPage: typeof fetch = fetch) {
  const origin =
    process.env.INTERNAL_API_ORIGIN ??
    (process.env.NODE_ENV === 'production'
      ? `http://127.0.0.1:${process.env.PORT ?? '3100'}`
      : 'http://127.0.0.1:3101');
  try {
    const response = await fetchPage(new URL('/api/v1/pages/accueil', origin), {
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) {
      throw new Response('Page introuvable.', { status: 404 });
    }
    if (!response.ok) {
      throw new Error(`Réponse API inattendue : ${response.status}`);
    }
    return publishedPageSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Chargement du contenu impossible.', error);
    throw new Response('Le contenu est temporairement indisponible.', {
      status: 503,
    });
  }
}
