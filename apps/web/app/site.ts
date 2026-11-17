export type ClientProjectMetadata = {
  path: string;
  name: string;
  title: string;
  workTitle: string;
  description: string;
  cover: { file: string; alt: string };
};

export const viandesDesSommets: ClientProjectMetadata = {
  path: '/clients/viandes-des-sommets/',
  name: 'Viandes des Sommets',
  title: 'Viandes des Sommets — Identité visuelle & logo | EPICC',
  workTitle: 'Viandes des Sommets — Identité visuelle',
  description:
    'Découvrez l’identité visuelle de Viandes des Sommets par EPICC : construction du logo, univers photographique, packaging et déclinaisons de marque.',
  cover: {
    file: 'viandes-des-sommets/ouverture.webp',
    alt: 'Univers de marque Viandes des Sommets',
  },
};

export function getPublicSiteUrl() {
  if (!process.env.PUBLIC_SITE_URL?.trim()) return null;
  const url = new URL(process.env.PUBLIC_SITE_URL.trim());
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.href !== url.origin + url.pathname
  )
    throw new Error(
      'PUBLIC_SITE_URL doit être une URL HTTP ou HTTPS sans identifiants, paramètres ni fragment.',
    );
  return url;
}

export function getContactEmail() {
  const email = process.env.CONTACT_EMAIL?.trim();
  if (!email) return null;
  if (!/^[\w.!$%'+=~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
    throw new Error(
      'CONTACT_EMAIL doit être une adresse de contact publique valide.',
    );
  return email;
}

export function projectStructuredData(
  baseUrl: string,
  image: string,
  { path, name, title, workTitle, description }: ClientProjectMetadata,
) {
  const url = baseUrl + path;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: title,
        description,
        inLanguage: 'fr-FR',
        isPartOf: { '@id': `${baseUrl}/#site` },
        primaryImageOfPage: { '@type': 'ImageObject', url: image },
        mainEntity: { '@id': `${url}#projet` },
        breadcrumb: { '@id': `${url}#fil-ariane` },
      },
      {
        '@type': 'CreativeWork',
        '@id': `${url}#projet`,
        name: workTitle,
        description,
        image,
        url,
        inLanguage: 'fr-FR',
        creator: { '@id': `${baseUrl}/#organisation` },
        about: { '@type': 'Organization', name },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#fil-ariane`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: `${baseUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name,
            item: url,
          },
        ],
      },
    ],
  };
}
