export type Piece = {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alt?: string;
  mirror?: boolean;
  crop?: boolean;
};

// Le collage utilise le repère de la maquette à partir de y = 4466.
// Chaque projet redevient une figure autonome dans la lecture mobile.
export const vitrineProjects: { name: string; pieces: Piece[] }[] = [
  {
    name: 'Viande des Sorgues',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334231.png',
        x: 104,
        y: 4570,
        width: 599,
        height: 176,
      },
      {
        file: 'Rectangle5.png',
        x: 737,
        y: 4570,
        width: 222,
        height: 283,
        alt: 'Gros plan sur une tomate rouge.',
      },
    ],
  },
  {
    name: 'Annafurna',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334241.png',
        x: 1210,
        y: 4466,
        width: 248,
        height: 123,
      },
      {
        file: 'D8DV39.png',
        x: 993,
        y: 4503,
        width: 116,
        height: 173,
        alt: 'Table et assiettes photographiées en plongée.',
      },
      {
        file: 'Rectangle6.png',
        x: 992,
        y: 4698,
        width: 230,
        height: 405,
        alt: 'Paysage de montagne et repas en plein air.',
      },
    ],
  },
  {
    name: 'Casamatta',
    pieces: [
      {
        file: 'IllustrationSansTitre521.png',
        x: 1290,
        y: 5081,
        width: 423,
        height: 101,
      },
      {
        file: 'Rectangle4.png',
        x: 839,
        y: 4870,
        width: 123,
        height: 194,
        alt: 'Viande grillée photographiée de près.',
      },
      {
        file: 'Dsc19081.jpg',
        x: 785,
        y: 5081,
        width: 177,
        height: 266,
        alt: 'Intérieur chaleureux d’un restaurant.',
      },
      {
        file: 'Dsc10951.jpg',
        x: 993,
        y: 5132,
        width: 297,
        height: 446,
        alt: 'Texture bleue, détail du projet Casamatta.',
      },
    ],
  },
  {
    name: 'Club des riches',
    pieces: [
      {
        file: 'IllustrationSansTitre501.png',
        x: 193,
        y: 5744,
        width: 437,
        height: 143,
      },
      {
        file: 'Dsc067761.jpg',
        x: 715,
        y: 5373,
        width: 247,
        height: 371,
        alt: 'Plat dressé et herbes fraîches.',
        mirror: true,
      },
      {
        file: 'Gkmkqt.png',
        x: 993,
        y: 5606,
        width: 136.95,
        height: 243.47,
        alt: 'Composition d’œufs blancs.',
      },
    ],
  },
  {
    name: 'Origin',
    pieces: [
      {
        file: 'IllustrationSansTitre491.png',
        x: 1363,
        y: 5995,
        width: 189,
        height: 110,
      },
      {
        file: 'Rectangle7.png',
        x: 993,
        y: 5877,
        width: 228,
        height: 418,
        alt: 'Service du vin à table.',
      },
    ],
  },
  {
    name: 'Les Trois Sœurs',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342521.png',
        x: 193,
        y: 6493,
        width: 474,
        height: 102,
      },
      {
        file: 'Rectangle8.jpg',
        x: 674,
        y: 6061,
        width: 288,
        height: 432,
        alt: 'Table garnie de plats à partager.',
      },
      {
        file: 'Dsc18591.jpg',
        x: 993,
        y: 6439,
        width: 285,
        height: 290,
        alt: 'Cookies au chocolat.',
        crop: true,
      },
      {
        file: 'Dsc09451.jpg',
        x: 721,
        y: 6536,
        width: 235,
        height: 352,
        alt: 'Tartine garnie sur fond rose.',
      },
    ],
  },
  {
    name: 'Le Conseil',
    pieces: [
      {
        file: 'CaptureDecran20261029A1533426.png',
        x: 1278,
        y: 6989,
        width: 340,
        height: 124,
      },
    ],
  },
  {
    name: 'L’Écluse Douze — Deux Mnu',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342121.png',
        x: 329,
        y: 7134,
        width: 260,
        height: 115,
      },
      {
        file: 'CaptureDecran20261029A15334261.png',
        x: 324,
        y: 7213,
        width: 293,
        height: 107,
      },
    ],
  },
  {
    name: 'Le Carré Vert',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334271.png',
        x: 1284,
        y: 7528,
        width: 489,
        height: 178,
      },
    ],
  },
  {
    name: 'La Spinière',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334281.png',
        x: 269,
        y: 7956,
        width: 322,
        height: 141,
      },
    ],
  },
  {
    name: 'Allegria',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334291.png',
        x: 1338,
        y: 8298,
        width: 265,
        height: 123,
      },
    ],
  },
  {
    name: 'La Grinta',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342101.png',
        x: 317,
        y: 8483,
        width: 306,
        height: 128,
      },
    ],
  },
  {
    name: 'L’Écluse Douze',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342111.png',
        x: 1270,
        y: 8655,
        width: 333,
        height: 147,
      },
    ],
  },
];
