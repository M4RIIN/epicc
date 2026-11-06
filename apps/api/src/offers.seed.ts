import type { Offer } from '@epicc/content-contracts';

export const previousOffers: Offer[] = [
  {
    slug: 'creation-de-marque',
    image: null,
    alt: '',
    position: 0,
    name: 'Création de marque',
    description:
      'Création de l’identité visuelle, positionnement, stratégie de communication et mise en valeur des produits et des établissements',
  },
  {
    slug: 'restructuration-de-restaurants',
    image: null,
    alt: '',
    position: 1,
    name: 'Restructuration de restaurants',
    description:
      'Accompagnement stratégique, audit, refonte de l’identité et optimisation de la communication pour établissement existant',
  },
  {
    slug: 'reseaux-sociaux',
    image: null,
    alt: '',
    position: 2,
    name: 'Réseaux sociaux',
    description: 'Community management, animation réseaux sociaux',
  },
  {
    slug: 'evenementiel',
    image: null,
    alt: '',
    position: 3,
    name: 'Événementiel',
    description:
      'Organisation et gestion de la communication d’événements sur mesure (soirées de networking ou lancement), scénographie de tables, recherche de traiteurs et de prestataires',
  },
  {
    slug: 'video-photographe',
    image: null,
    alt: '',
    position: 4,
    name: 'Vidéo & photographe',
    description:
      'Identité visuelle (création de logo, iconographie…), chartes graphiques et autres supports de communication, packaging, affiches',
  },
];

// Le catalogue visible dans la maquette, avec les identifiants historiques
// pour conserver les images déjà administrées.
export const initialOffers: Offer[] = [
  {
    slug: 'creation-de-marque',
    name: 'Lancement de marque',
    summary: 'Créer une identité visuelle\nRévéler une marque',
    description: 'Créer une identité visuelle et révéler une marque.',
    image: null,
    alt: '',
    position: 0,
  },
  {
    slug: 'restructuration-de-restaurants',
    name: 'Restructuration',
    summary:
      'Auditer la stratégie existante\nBenchmarker le marché\nAnimer des ateliers stratégiques',
    description:
      'Comprendre ce qui n’a pas marché et garder ce qui fonctionne\nVisualiser les possibilités, définir un positionnement\nPrendre du recul sur l’existant, écrire la suite en collectif',
    image: null,
    alt: '',
    position: 1,
  },
  {
    slug: 'video-photographe',
    name: 'Création de contenus',
    summary: 'Photos\nVidéos',
    description:
      'Shooting corporate, soirées, shooting produits, mariages/baptêmes\nRéels courts, aftermovie, podcasts, interviews, team-building',
    image: null,
    alt: '',
    position: 2,
  },
  {
    slug: 'reseaux-sociaux',
    name: 'Réseaux',
    summary: 'Community management',
    description:
      'Google Ads, référencement, maquettes de réseaux sociaux (feed type Instagram, site web)\nPages Instagram, LinkedIn, Google',
    image: null,
    alt: '',
    position: 3,
  },
  {
    slug: 'graphisme',
    name: 'Graphisme',
    summary: 'Digital & print',
    description: 'Création d’affiches, menus, flyers, cartes de visite',
    image: null,
    alt: '',
    position: 4,
  },
  {
    slug: 'evenementiel',
    name: 'Événementiel & scénographie',
    summary:
      'Scénographie de restauration / tables\nPilotage et communication d’un événement sur mesure',
    description:
      '« Plan de scénographie », aménagement et décoration\nSoirées d’anniversaire, team-building, networking, à quatre mains,\npodcasts, interviews / recherche de traiteurs, prestataires',
    image: null,
    alt: '',
    position: 5,
  },
];
