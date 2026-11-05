export type Piece = {
  file: string;
  role: 'name' | 'photo';
  width: number;
  height: number;
  alt?: string;
  mirror?: boolean;
  crop?: boolean;
};

export type VitrineProject = {
  name: string;
  side: 'left' | 'right';
  pieces: Piece[];
};

export const projectSides = ['left', 'right'] as const;

// Les deux colonnes avancent indépendamment. Chaque titre et sa pile de photos
// appartiennent au même projet, dans la vitrine comme dans la gestion.
// Les noms de fichiers restent stables pour conserver les images téléversées.
export const vitrineProjects: VitrineProject[] = [
  {
    name: 'Viande des Sorgues',
    side: 'left',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334231.png',
        width: 599,
        height: 176,
        role: 'name',
      },
      {
        file: 'Rectangle5.png',
        width: 222,
        height: 283,
        alt: 'Gros plan sur une tomate rouge.',
        role: 'photo',
      },
      {
        file: 'Rectangle4.png',
        width: 123,
        height: 194,
        alt: 'Viande grillée photographiée de près.',
        role: 'photo',
      },
      {
        file: 'Dsc19081.jpg',
        width: 177,
        height: 266,
        alt: 'Intérieur chaleureux d’un restaurant.',
        role: 'photo',
      },
      {
        file: 'Dsc067761.jpg',
        width: 247,
        height: 371,
        alt: 'Plat dressé et herbes fraîches.',
        mirror: true,
        role: 'photo',
      },
    ],
  },
  {
    name: 'Annafurna',
    side: 'right',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334241.png',
        width: 248,
        height: 123,
        role: 'name',
      },
      {
        file: 'D8DV39.png',
        width: 116,
        height: 173,
        alt: 'Table et assiettes photographiées en plongée.',
        role: 'photo',
      },
      {
        file: 'Rectangle6.png',
        width: 230,
        height: 405,
        alt: 'Paysage de montagne et repas en plein air.',
        role: 'photo',
      },
    ],
  },
  {
    name: 'Casamatta',
    side: 'right',
    pieces: [
      {
        file: 'IllustrationSansTitre521.png',
        width: 423,
        height: 101,
        role: 'name',
      },
      {
        file: 'Dsc10951.jpg',
        width: 297,
        height: 446,
        alt: 'Texture bleue, détail du projet Casamatta.',
        role: 'photo',
      },
      {
        file: 'Gkmkqt.png',
        width: 136.95,
        height: 243.47,
        alt: 'Balles de golf blanches, détail du projet Casamatta.',
        role: 'photo',
      },
    ],
  },
  {
    name: 'Club des riches',
    side: 'left',
    pieces: [
      {
        file: 'IllustrationSansTitre501.png',
        width: 437,
        height: 143,
        role: 'name',
      },
      {
        file: 'Rectangle8.jpg',
        width: 288,
        height: 432,
        alt: 'Table garnie de plats à partager.',
        role: 'photo',
      },
    ],
  },
  {
    name: 'Origin',
    side: 'right',
    pieces: [
      {
        file: 'IllustrationSansTitre491.png',
        width: 189,
        height: 110,
        role: 'name',
      },
      {
        file: 'Rectangle7.png',
        width: 228,
        height: 418,
        alt: 'Service du vin à table.',
        role: 'photo',
      },
      {
        file: 'Dsc18591.jpg',
        width: 285,
        height: 290,
        alt: 'Cookies au chocolat.',
        crop: true,
        role: 'photo',
      },
    ],
  },
  {
    name: 'Les Trois Sœurs',
    side: 'left',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342521.png',
        width: 474,
        height: 102,
        role: 'name',
      },
      {
        file: 'Dsc09451.jpg',
        width: 235,
        height: 352,
        alt: 'Tartine garnie sur fond rose.',
        role: 'photo',
      },
    ],
  },
  {
    name: 'Le Conseil',
    side: 'right',
    pieces: [
      {
        file: 'CaptureDecran20261029A1533426.png',
        width: 340,
        height: 124,
        role: 'name',
      },
    ],
  },
  {
    name: 'L’Écluse Douze — Deux Mnu',
    side: 'left',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342121.png',
        width: 260,
        height: 115,
        role: 'name',
      },
      {
        file: 'CaptureDecran20261029A15334261.png',
        width: 293,
        height: 107,
        role: 'name',
      },
    ],
  },
  {
    name: 'Le Carré Vert',
    side: 'right',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334271.png',
        width: 489,
        height: 178,
        role: 'name',
      },
    ],
  },
  {
    name: 'La Spinière',
    side: 'left',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334281.png',
        width: 322,
        height: 141,
        role: 'name',
      },
    ],
  },
  {
    name: 'Allegria',
    side: 'right',
    pieces: [
      {
        file: 'CaptureDecran20261029A15334291.png',
        width: 265,
        height: 123,
        role: 'name',
      },
    ],
  },
  {
    name: 'La Grinta',
    side: 'left',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342101.png',
        width: 306,
        height: 128,
        role: 'name',
      },
    ],
  },
  {
    name: 'L’Écluse Douze',
    side: 'right',
    pieces: [
      {
        file: 'CaptureDecran20261029A153342111.png',
        width: 333,
        height: 147,
        role: 'name',
      },
    ],
  },
];
