export const projectPath = '/clients/viandes-des-sommets/';
export const projectTitle =
  'Viandes des Sommets — Identité visuelle & logo | EPICC';
export const projectDescription =
  'Découvrez l’identité visuelle de Viandes des Sommets par EPICC : construction du logo, univers photographique, packaging et déclinaisons de marque.';

export function getPublicOrigin() {
  if (!process.env.PUBLIC_SITE_URL?.trim()) return null;
  const url = new URL(process.env.PUBLIC_SITE_URL.trim());
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.href !== `${url.origin}/`
  )
    throw new Error(
      'PUBLIC_SITE_URL doit être une origine HTTP ou HTTPS sans chemin.',
    );
  return url.origin;
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

export function projectStructuredData(origin: string, image: string) {
  const url = origin + projectPath;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: projectTitle,
        description: projectDescription,
        inLanguage: 'fr-FR',
        isPartOf: { '@id': `${origin}/#site` },
        primaryImageOfPage: { '@type': 'ImageObject', url: image },
        mainEntity: { '@id': `${url}#projet` },
        breadcrumb: { '@id': `${url}#fil-ariane` },
      },
      {
        '@type': 'CreativeWork',
        '@id': `${url}#projet`,
        name: 'Viandes des Sommets — Identité visuelle',
        description: projectDescription,
        image,
        url,
        inLanguage: 'fr-FR',
        creator: { '@id': `${origin}/#organisation` },
        about: { '@type': 'Organization', name: 'Viandes des Sommets' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#fil-ariane`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: `${origin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Viandes des Sommets',
            item: url,
          },
        ],
      },
    ],
  };
}
