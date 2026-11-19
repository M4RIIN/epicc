export type ClientProjectMetadata = {
  path: string;
  name: string;
  title: string;
  workTitle: string;
  description: string;
  cover: { file: string; alt: string };
  previewFile: string;
};

export const amafolia: ClientProjectMetadata = {
  path: '/clients/amafolia/',
  name: 'Amafolia',
  title: 'Amafolia — Identité visuelle & photographie | EPICC',
  workTitle: 'Amafolia — Identité visuelle',
  description:
    'Découvrez la nouvelle identité d’Amafolia, restaurant italien : stratégie, création du logo, reportage photo et déclinaisons sur les supports du restaurant.',
  cover: {
    file: 'amafolia/amafolia-motif.webp',
    alt: 'Motif des logos Amafolia en bleu et vert',
  },
  previewFile: 'amafolia/apercu-amafolia.webp',
};

export const viandesDesSommets: ClientProjectMetadata = {
  path: '/clients/viandes-des-sommets/',
  name: 'Viandes des Sommets',
  title: 'Viandes des Sommets — Identité visuelle & logo | EPICC',
  workTitle: 'Viandes des Sommets — Identité visuelle',
  description:
    'Découvrez l’identité visuelle de Viandes des Sommets par EPICC : construction du logo, reportage photographique dans les Pyrénées et création des emballages.',
  cover: {
    file: 'viandes-des-sommets/vds-ouverture.webp',
    alt: 'Pièce de viande suspendue au-dessus d’une assiette, dans l’univers Viandes des Sommets',
  },
  previewFile: 'viandes-des-sommets/apercu-viandes-des-sommets.webp',
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
