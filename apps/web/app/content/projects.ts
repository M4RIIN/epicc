import { projectPath } from '../site';

export type Piece = {
  file: string;
  role: 'name' | 'photo';
  width: number;
  height: number;
  alt?: string;
  mirror?: boolean;
};

const photo = (
  file: string,
  width: number,
  height: number,
  alt: string,
): Piece => ({ file, width, height, alt, role: 'photo' });
export const projects: Project[] = [
  {
    name: 'Amafolia',
    side: 'right',
    lettering: {
      file: 'CaptureDecran20261029A15334241.png',
      width: 248,
      height: 123,
      role: 'name',
    },
    photos: [
      {
        ...photo('Dsc067761.jpg', 181, 272, 'Plat dressé pour Amafolia.'),
        mirror: true,
      },
      photo('Dsc23991.png', 160, 240, 'Assiettes à partager chez Amafolia.'),
    ],
  },
  {
    name: 'Viandes des Sommets',
    side: 'left',
    href: projectPath,
    lettering: {
      file: 'CaptureDecran20261029A15334231.png',
      width: 599,
      height: 176,
      role: 'name',
    },
    photos: [
      photo(
        'Rectangle6.png',
        230,
        405,
        'Viandes des Sommets, repas face aux montagnes.',
      ),
      photo('Rectangle4.png', 222, 350, 'Viande grillée, Viandes des Sommets.'),
    ],
  },
  {
    name: 'Casamatta',
    side: 'right',
    lettering: {
      file: 'IllustrationSansTitre521.png',
      width: 423,
      height: 101,
      role: 'name',
    },
    photos: [
      photo('Dsc19081.jpg', 192, 288, 'Intérieur du restaurant Casamatta.'),
      photo('Dsc10951.jpg', 240, 360, 'Texture bleue de Casamatta.'),
    ],
  },
  {
    name: 'Origin',
    side: 'right',
    lettering: {
      file: 'IllustrationSansTitre491.png',
      width: 189,
      height: 110,
      role: 'name',
    },
    photos: [
      photo(
        'Rectangle8.jpg',
        288,
        432,
        'Table garnie de plats à partager chez Origin.',
      ),
      photo('Dsc13161.png', 280, 412, 'Terrasse du restaurant Origin.'),
    ],
  },
  {
    name: 'Les Trois Sœurs',
    side: 'left',
    lettering: {
      file: 'CaptureDecran20261029A153342521.png',
      width: 474,
      height: 102,
      role: 'name',
    },
    photos: [
      photo('TroisSoeurs.png', 280, 354, 'Pancakes des Trois Sœurs.'),
      photo('Dsc18591.jpg', 307, 312, 'Cookies au chocolat des Trois Sœurs.'),
    ],
  },
  {
    name: 'Le Conseil',
    side: 'right',
    lettering: {
      file: 'CaptureDecran20261029A1533426.png',
      width: 340,
      height: 124,
      role: 'name',
    },
    photos: [
      photo(
        'CopieDeLeConseil31.png',
        218,
        273,
        'Identité visuelle du Conseil, carte de visite.',
      ),
      photo(
        '171.png',
        231,
        289,
        'Identité visuelle du Conseil, porte-documents.',
      ),
    ],
  },
  {
    name: 'Deux Main',
    side: 'left',
    lettering: {
      file: 'CaptureDecran20261029A15334261.png',
      width: 293,
      height: 107,
      role: 'name',
    },
    photos: [
      photo('Dsc08681.png', 262, 393, 'Préparation d’un menu, Deux Main.'),
      photo('Dsc08481.png', 289, 434, 'Travail en cuisine chez Deux Main.'),
    ],
  },
  {
    name: 'Le Carré Vert',
    side: 'right',
    lettering: {
      file: 'CaptureDecran20261029A15334271.png',
      width: 489,
      height: 178,
      role: 'name',
    },
    photos: [
      photo('Dsc23481.png', 315, 472, 'Assiette du Carré Vert.'),
      photo('Dsc23871.png', 249, 458, 'Portrait au Carré Vert.'),
    ],
  },
  {
    name: 'Allegria',
    side: 'left',
    lettering: {
      file: 'CaptureDecran20261029A15334291.png',
      width: 265,
      height: 123,
      role: 'name',
    },
    photos: [
      photo(
        'Allegria1.png',
        256,
        320,
        'Bouteille de vin dans les vignes, Allegria.',
      ),
      photo('Allegria2.png', 253, 366, 'Salle du restaurant Allegria.'),
    ],
  },
  {
    name: 'L’Écluse Douze',
    side: 'right',
    lettering: {
      file: 'CaptureDecran20261029A153342121.png',
      width: 260,
      height: 115,
      role: 'name',
    },
    photos: [
      photo('Ecluse1.png', 302, 393, 'Plat au fromage de L’Écluse Douze.'),
      photo('Ecluse2.png', 316, 365, 'Dégustation à L’Écluse Douze.'),
    ],
  },
  {
    name: 'La Grinta',
    side: 'left',
    lettering: {
      file: 'CaptureDecran20261029A153342101.png',
      width: 306,
      height: 128,
      role: 'name',
    },
    photos: [
      photo(
        'Grinta1.png',
        274,
        411,
        'Microphone, création de contenu pour La Grinta.',
      ),
      photo('Grinta2.png', 328, 492, 'Portrait pour La Grinta.'),
    ],
  },
];

export type Project = {
  name: string;
  side: 'left' | 'right';
  href?: string;
  lettering: Piece;
  photos: [Piece] | [Piece, Piece];
};
