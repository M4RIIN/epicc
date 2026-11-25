import {
  amafolia,
  viandesDesSommets,
  type ClientProjectMetadata,
} from '../site';

type ProjectPhoto = {
  file: string;
  width: number;
  height: number;
  alt: string;
  top?: number;
  inset?: number;
};

type ProjectCaption = {
  lettering: string;
  width: number;
  height: number;
  service: string;
  date: string;
  top: number;
};

export type Project = {
  name: string;
  side: 'left' | 'right';
  height: number;
  page?: ClientProjectMetadata;
  caption?: ProjectCaption;
  photos: [ProjectPhoto | undefined, ProjectPhoto];
};

export const projects: Project[] = [
  {
    name: 'Amafolia',
    side: 'right',
    height: 362,
    page: amafolia,
    caption: {
      lettering: 'CaptureDecran20261029A15334241.png',
      width: 218,
      height: 107,
      service: 'Restructuration',
      date: 'Octobre 2026',
      top: 272,
    },
    photos: [
      {
        file: 'projets-amafolia-entree.webp',
        width: 202,
        height: 304,
        top: 75,
        inset: 19,
        alt: 'Entrée dressée pour Amafolia.',
      },
      {
        file: 'projets-amafolia-plat.webp',
        width: 242,
        height: 337,
        inset: 18,
        alt: 'Assiette de pâtes chez Amafolia.',
      },
    ],
  },
  {
    name: 'Viandes des Sommets',
    side: 'left',
    height: 423,
    page: viandesDesSommets,
    caption: {
      lettering: 'viandes-lettrage.webp',
      width: 239,
      height: 174,
      service: 'Lancement de marque',
      date: 'Décembre 2025',
      top: 199,
    },
    photos: [
      {
        file: 'projets-viandes-paturage.webp',
        width: 213,
        height: 320,
        top: 60,
        inset: 12,
        alt: 'Éleveur et troupeau en pâturage dans les Pyrénées.',
      },
      {
        file: 'projets-viandes-grillees.webp',
        width: 262,
        height: 412,
        inset: 8,
        alt: 'Pièce de viande grillée, Viandes des Sommets.',
      },
    ],
  },
  {
    name: 'Casamatta',
    side: 'right',
    height: 417,
    caption: {
      lettering: 'IllustrationSansTitre521.png',
      width: 357,
      height: 85,
      service: 'Lancement de marque',
      date: 'Septembre 2026',
      top: 169,
    },
    photos: [
      {
        file: 'projets-Dsc19081.jpg',
        width: 218,
        height: 327,
        inset: 8,
        alt: 'Salle du restaurant Casamatta.',
      },
      {
        file: 'projets-casamatta-dessert.webp',
        width: 240,
        height: 360,
        top: 19,
        inset: 2,
        alt: 'Dessert servi chez Casamatta.',
      },
    ],
  },
  {
    name: 'Club des Biches',
    side: 'left',
    height: 378,
    caption: {
      lettering: 'club-des-biches-lettrage.webp',
      width: 220,
      height: 92,
      service: 'Événementiel · Réseaux sociaux',
      date: 'Décembre 2025',
      top: 96,
    },
    photos: [
      undefined,
      {
        file: 'projets-club-des-biches.webp',
        width: 211,
        height: 307,
        inset: 28,
        alt: 'Ballons texturés du Club des Biches.',
      },
    ],
  },
  {
    name: 'Origin',
    side: 'right',
    height: 395,
    caption: {
      lettering: 'IllustrationSansTitre491.png',
      width: 181,
      height: 105,
      service: 'Lancement de marque',
      date: 'Décembre 2025',
      top: 188,
    },
    photos: [
      undefined,
      {
        file: 'projets-origin-portrait.webp',
        width: 248,
        height: 372,
        inset: 28,
        alt: 'Un verre à la main, chemise brodée Origin.',
      },
    ],
  },
  {
    name: 'Les Trois Sœurs',
    side: 'left',
    height: 364,
    caption: {
      lettering: 'trois-soeurs-lettrage.webp',
      width: 305,
      height: 157,
      service: 'Réseaux sociaux',
      date: 'Juin 2025',
      top: 242,
    },
    photos: [
      {
        file: 'projets-TroisSoeurs.png',
        width: 280,
        height: 354,
        top: 57,
        alt: 'Pancakes des Trois Sœurs.',
      },
      {
        file: 'projets-trois-soeurs-cafe.webp',
        width: 228,
        height: 341,
        inset: 24,
        alt: 'Grains de café torréfiés.',
      },
    ],
  },
  {
    name: 'Le Conseil',
    side: 'right',
    height: 299,
    caption: {
      lettering: 'CaptureDecran20261029A1533426.png',
      width: 271,
      height: 99,
      service: 'Graphisme',
      date: 'Mars 2026',
      top: 137,
    },
    photos: [
      {
        file: 'projets-CopieDeLeConseil31.png',
        width: 218,
        height: 273,
        top: 92,
        inset: 12,
        alt: 'Identité visuelle du Conseil, carte de visite.',
      },
      {
        file: 'projets-171.png',
        width: 231,
        height: 289,
        alt: 'Identité visuelle du Conseil, porte-documents.',
      },
    ],
  },
  {
    name: 'Deux Main',
    side: 'left',
    height: 491,
    caption: {
      lettering: 'CaptureDecran20261029A15334261.png',
      width: 209,
      height: 76,
      service: 'Restructuration',
      date: 'Juillet 2026',
      top: 322,
    },
    photos: [
      {
        file: 'projets-Dsc08681.png',
        width: 262,
        height: 393,
        top: 111,
        inset: 18,
        alt: 'Préparation d’un menu, Deux Main.',
      },
      {
        file: 'projets-Dsc08481.png',
        width: 289,
        height: 434,
        alt: 'Travail en cuisine chez Deux Main.',
      },
    ],
  },
  {
    name: 'Le Carré Vert',
    side: 'right',
    height: 514,
    caption: {
      lettering: 'CaptureDecran20261029A15334271.png',
      width: 345,
      height: 126,
      service: 'Restructuration',
      date: 'Octobre 2026',
      top: 265,
    },
    photos: [
      {
        file: 'projets-carre-vert-dessert.webp',
        width: 315,
        height: 472,
        top: 31,
        inset: 18,
        alt: 'Dessert aux groseilles du Carré Vert.',
      },
      {
        file: 'projets-carre-vert-portrait.webp',
        width: 249,
        height: 458,
        alt: 'Portrait au Carré Vert.',
      },
    ],
  },
  {
    name: 'Allegria',
    side: 'left',
    height: 366,
    caption: {
      lettering: 'allegria-lettrage.webp',
      width: 218,
      height: 118,
      service: 'Restructuration',
      date: 'Janvier 2026',
      top: 203,
    },
    photos: [
      {
        file: 'projets-allegria-vignes.webp',
        width: 269,
        height: 337,
        inset: 41,
        alt: 'Grappe de raisin dans les vignes d’Allegria.',
      },
      {
        file: 'projets-allegria-tonneaux.webp',
        width: 293,
        height: 366,
        alt: 'Tonneaux en bois chez Allegria.',
      },
    ],
  },
  {
    name: 'L’Écluse Douze',
    side: 'right',
    height: 408,
    photos: [
      {
        file: 'projets-Ecluse1.png',
        width: 302,
        height: 393,
        inset: 18,
        alt: 'Plat au fromage de L’Écluse Douze.',
      },
      {
        file: 'projets-Ecluse2.png',
        width: 316,
        height: 365,
        top: 39,
        alt: 'Dégustation à L’Écluse Douze.',
      },
    ],
  },
  {
    name: 'La Grinta',
    side: 'left',
    height: 427,
    caption: {
      lettering: 'CaptureDecran20261029A153342101.png',
      width: 306,
      height: 128,
      service: 'Lancement de marque',
      date: 'Janvier 2026',
      top: 216,
    },
    photos: [
      {
        file: 'projets-Grinta1.png',
        width: 274,
        height: 411,
        inset: 38,
        alt: 'Microphone, création de contenu pour La Grinta.',
      },
      {
        file: 'projets-Grinta2.png',
        width: 328,
        height: 492,
        top: 17,
        alt: 'Portrait pour La Grinta.',
      },
    ],
  },
  {
    name: 'Fitness by Leslie',
    side: 'left',
    height: 541,
    photos: [
      {
        file: 'Fitness1.png',
        width: 338,
        height: 425,
        inset: 18,
        alt: 'Séance de renforcement avec haltères, Fitness by Leslie.',
      },
      {
        file: 'Fitness2.png',
        width: 326,
        height: 409,
        top: 132,
        alt: 'Séance de fitness avec ballon, Fitness by Leslie.',
      },
    ],
  },
];
