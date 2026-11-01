import type { Client } from '@epicc/content-contracts';

const path = '/images/projets/';
const entries = [
  {
    slug: 'viandes-des-sommets',
    name: 'Viandes des Sommets',
    artwork: ['nom-viandes', 503, 79],
    photos: [
      'viandes-tomate',
      'viandes-grillade',
      'viandes-restaurant',
      'viandes-assiette',
    ],
  },
  {
    slug: 'amafolia',
    name: 'Amafolia',
    artwork: ['nom-amafolia', 219, 81],
    photos: ['amafolia-cuisine', 'amafolia-montagne'],
  },
  {
    slug: 'club-des-biche',
    name: 'Club des Biche',
    artwork: ['nom-club', 416, 81],
    photos: ['club-table'],
  },
  {
    slug: 'casamatta',
    name: 'Casamatta',
    artwork: ['nom-casamatta', 315, 85],
    photos: ['casamatta-bleu', 'casamatta-golf'],
  },
  {
    slug: 'les-trois-soeurs',
    name: 'Les Trois Sœurs',
    artwork: ['nom-trois-soeurs', 410, 83],
    photos: ['trois-soeurs-assiette'],
  },
  {
    slug: 'origin',
    name: 'Origin',
    artwork: ['nom-origin', 180, 95],
    photos: ['origin-vin', 'origin-cookies'],
  },
  {
    slug: 'deux-main',
    name: 'Deux Main',
    artwork: ['nom-deux-main', 252, 80],
    photos: [],
  },
  {
    slug: 'le-conseil',
    name: 'Le Conseil',
    artwork: ['nom-le-conseil', 270, 72],
    photos: [],
  },
  {
    slug: 'le-carre-vert',
    name: 'Le Carré Vert',
    artwork: ['nom-carre-vert', 392, 107],
    photos: [],
  },
] as const;

// Contenus de la maquette fournie. Les fixtures de test sont injectées séparément.
export const referenceProjects: Client[] = entries.map((entry, position) => ({
  slug: entry.slug,
  number: String(position + 1).padStart(2, '0'),
  name: entry.name,
  sector: 'Projet client',
  place: 'Non renseigné',
  year: '2026',
  image: entry.photos[0] ? `${path}${entry.photos[0]}.png` : null,
  alt: `Projet ${entry.name}`,
  gallery: entry.photos.slice(1).map((photo, index) => ({
    image: `${path}${photo}.png`,
    alt: `${entry.name} — photo ${index + 2}`,
  })),
  nameArtwork: {
    image: `${path}${entry.artwork[0]}.png`,
    name: entry.name,
    width: entry.artwork[1],
    height: entry.artwork[2],
  },
  tagline: entry.name,
  description: entry.name,
  need: 'Non renseigné',
  work: 'Non renseigné',
  note: 'Non renseigné',
  signature: entry.name,
  color: 'sage',
  published: true,
  position,
}));
