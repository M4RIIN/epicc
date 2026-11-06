import type { Offer } from '@epicc/content-contracts';

export const homeTitle =
  'Chloé Catala — Communication & identité visuelle à Toulouse | EPICC';
export const homeDescription =
  'Chloé Catala, EPICC : identité visuelle, stratégie de communication, restructuration de restaurants, réseaux sociaux et événementiel à Toulouse et alentour.';

// Les prestations restent celles publiées depuis le backoffice : aucune copie
// éditoriale à maintenir, ni page projet annoncée avant sa publication.
export function homeStructuredData(origin: string, offers: Offer[]) {
  const url = `${origin}/`;
  const organization = `${url}#organisation`;
  const person = `${url}#chloe-catala`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': person,
        name: 'Chloé Catala',
        url: `${url}#a-propos`,
        worksFor: { '@id': organization },
      },
      {
        '@type': 'Organization',
        '@id': organization,
        name: 'EPICC',
        url,
        description: homeDescription,
        founder: { '@id': person },
        areaServed: { '@type': 'Place', name: 'Toulouse et alentours' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Les prestations EPICC',
          itemListElement: offers.map((offer) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: offer.name,
              description: offer.description,
              url: `${url}#prestations`,
              provider: { '@id': organization },
              areaServed: { '@type': 'Place', name: 'Toulouse et alentours' },
            },
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#site`,
        name: 'EPICC',
        url,
        inLanguage: 'fr-FR',
        publisher: { '@id': organization },
      },
    ],
  };
}
