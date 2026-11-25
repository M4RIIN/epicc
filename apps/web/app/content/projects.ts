import {
  amafolia,
  viandesDesSommets,
  type ClientProjectMetadata,
} from '../site';

export type Piece = {
  file: string;
  width: number;
  height: number;
  alt?: string;
};

export type ProjectLabel = {
  tags: [string, string];
  lettering: Piece;
};

export type Project = {
  name: string;
  side: 'left' | 'right';
  page?: ClientProjectMetadata;
  label?: ProjectLabel;
  photos: [Piece] | [Piece, Piece];
};

const photo = (
  file: string,
  width: number,
  height: number,
  alt: string,
): Piece => ({ file: `projets-${file}`, width, height, alt });

const label = (
  tags: [string, string],
  file: string,
  width: number,
  height: number,
): ProjectLabel => ({
  tags,
  lettering: { file: `projets-${file}`, width, height },
});

export const projects: Project[] = [
  {
    name: 'Amafolia',
    side: 'right',
    page: amafolia,
    label: label(
      ['Restructuration', 'Octobre 2026'],
      'CaptureDecran20261029A15334241.png',
      184,
      65,
    ),
    photos: [
      photo('Burrata.jpg', 202, 304, 'Burrata et tomates cerises, Amafolia.'),
      photo('Pates.jpg', 242, 338, 'Assiette de pâtes fraîches, Amafolia.'),
    ],
  },
  {
    name: 'Viandes des Sommets',
    side: 'left',
    page: viandesDesSommets,
    label: label(
      ['Lancement de marque', 'Décembre 2025'],
      'ViandesDesSommets.png',
      220,
      78,
    ),
    photos: [
      photo(
        'Troupeau.jpg',
        214,
        320,
        'Éleveur au milieu de son troupeau, Viandes des Sommets.',
      ),
      photo('Rectangle4.png', 264, 412, 'Viande grillée, Viandes des Sommets.'),
    ],
  },
  {
    name: 'Casamatta',
    side: 'right',
    label: label(
      ['Lancement de marque', 'Septembre 2026'],
      'IllustrationSansTitre521.png',
      256,
      66,
    ),
    photos: [
      photo('Dsc19081.jpg', 218, 328, 'Intérieur du restaurant Casamatta.'),
      photo('PannaCotta.jpg', 240, 360, 'Panna cotta aux fruits rouges.'),
    ],
  },
  {
    name: 'Des Biches',
    side: 'left',
    label: label(
      ['Événementiel | Réseaux sociaux', 'Décembre 2025'],
      'DesBiches.png',
      185,
      50,
    ),
    photos: [photo('Golf.jpg', 206, 300, 'Balles de golf, Des Biches.')],
  },
  {
    name: 'Origin',
    side: 'right',
    label: label(
      ['Lancement de marque', 'Décembre 2025'],
      'IllustrationSansTitre491.png',
      170,
      90,
    ),
    photos: [
      photo(
        'OriginVin.jpg',
        248,
        372,
        'Verre de vin blanc servi par l’équipe d’Origin.',
      ),
    ],
  },
  {
    name: 'Les Trois Sœurs',
    side: 'left',
    label: label(
      ['Réseaux sociaux', 'Juin 2025'],
      'CaptureDecran20261029A153342521.png',
      300,
      59,
    ),
    photos: [
      photo('TroisSoeurs.png', 280, 354, 'Pancakes des Trois Sœurs.'),
      photo('Cafe.jpg', 228, 340, 'Grains de café torréfiés.'),
    ],
  },
  {
    name: 'Le Conseil',
    side: 'right',
    label: label(
      ['Graphisme', 'Mars 2026'],
      'CaptureDecran20261029A1533426.png',
      213,
      56,
    ),
    photos: [
      photo(
        'CopieDeLeConseil31.png',
        218,
        272,
        'Identité visuelle du Conseil, carte de visite.',
      ),
      photo(
        '171.png',
        228,
        290,
        'Identité visuelle du Conseil, porte-documents.',
      ),
    ],
  },
  {
    name: 'Deux Main',
    side: 'left',
    label: label(
      ['Restructuration', 'Juillet 2026'],
      'CaptureDecran20261029A15334261.png',
      175,
      54,
    ),
    photos: [
      photo('Dsc08681.png', 262, 392, 'Préparation d’un menu, Deux Main.'),
      photo('Dsc08481.png', 288, 434, 'Atelier autour de la carte, Deux Main.'),
    ],
  },
  {
    name: 'Le Carré Vert',
    side: 'right',
    label: label(
      ['Restructuration', 'Octobre 2026'],
      'CaptureDecran20261029A15334271.png',
      318,
      84,
    ),
    photos: [
      photo('Gateau.jpg', 316, 472, 'Dessert aux groseilles du Carré Vert.'),
      photo('Dsc23871.png', 248, 458, 'Portrait du chef du Carré Vert.'),
    ],
  },
  {
    name: 'Allegria',
    side: 'left',
    label: label(
      ['Restructuration', 'Janvier 2026'],
      'CaptureDecran20261029A15334291.png',
      216,
      83,
    ),
    photos: [
      photo('Raisin.jpg', 268, 336, 'Grappe de raisin dans les vignes.'),
      photo('Futs.jpg', 292, 366, 'Fûts de chêne du domaine Allegria.'),
    ],
  },
  {
    name: 'L’Écluse Douze',
    side: 'right',
    photos: [
      photo('Ecluse1.png', 302, 392, 'Plat au fromage de L’Écluse Douze.'),
      photo('Ecluse2.png', 316, 362, 'Dégustation à L’Écluse Douze.'),
    ],
  },
  {
    name: 'La Grinta',
    side: 'left',
    label: label(
      ['Lancement de marque', 'Janvier 2026'],
      'CaptureDecran20261029A153342101.png',
      267,
      84,
    ),
    photos: [
      photo(
        'Grinta1.png',
        274,
        410,
        'Microphone, création de contenu pour La Grinta.',
      ),
      photo('Grinta2.png', 328, 492, 'Portrait pour La Grinta.'),
    ],
  },
  {
    name: 'Fitness by Leslie',
    side: 'left',
    photos: [
      photo(
        'Fitness1.png',
        338,
        424,
        'Séance de renforcement avec haltères, Fitness by Leslie.',
      ),
      photo(
        'Fitness2.png',
        352,
        441,
        'Séance de fitness avec ballon, Fitness by Leslie.',
      ),
    ],
  },
];
