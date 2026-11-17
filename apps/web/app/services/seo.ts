import { offers } from '../content/offers';

export const homeTitle =
  'Chloé Catala — Communication & identité visuelle à Toulouse | EPICC';
export const homeDescription =
  'Chloé Catala, EPICC : identité visuelle, stratégie de communication, restructuration de restaurants, réseaux sociaux et événementiel à Toulouse et alentour.';

export function homeStructuredData(origin: string) {
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
