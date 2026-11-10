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
        width: 160,
        height: 240,
        alt: 'Création culinaire photographiée pour Amafolia.',
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
      {
        file: '171.png',
        role: 'photo',
        width: 231,
        height: 289,
        alt: 'Identité visuelle du Conseil.',
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
      {
        file: 'CopieDeLeConseil31.png',
        role: 'photo',
        width: 314,
        height: 393,
        alt: 'Création graphique et illustration.',
      },
      {
        file: 'Dsc08681.png',
        role: 'photo',
        width: 262,
        height: 393,
        alt: 'Reportage photographique en restauration.',
      },
      {
        file: 'Dsc23481.png',
        role: 'photo',
        width: 315,
        height: 472,
        alt: 'Portrait réalisé pour un projet client.',
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
      {
        file: 'Dsc08481.png',
        role: 'photo',
        width: 280,
        height: 420,
        alt: 'Portrait réalisé au Carré Vert.',
      },
      {
        file: 'Dsc22501.png',
        role: 'photo',
        width: 158,
        height: 237,
        alt: 'Photographie réalisée au Carré Vert.',
      },
      {
        file: 'Dsc23871.png',
        role: 'photo',
        width: 312,
        height: 574,
        alt: 'Reportage photographique du Carré Vert.',
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

// Le catalogue distingue les clients ; les emplacements historiques restent la
// référence de composition, y compris la seconde apparition du même logo.
export const projectClients: VitrineProject[] = vitrineProjects.flatMap(
  (project) =>
    project.name === 'L’Écluse Douze — Deux Mnu'
      ? [
          {
            name: 'L’Écluse Douze',
            side: project.side,
            pieces: project.pieces.filter((piece) =>
              [
                'CaptureDecran20261029A153342121.png',
                'CopieDeLeConseil31.png',
              ].includes(piece.file),
            ),
          },
          {
            name: 'Deux Mnu',
            side: project.side,
            pieces: project.pieces.filter((piece) =>
              [
                'CaptureDecran20261029A15334261.png',
                'Dsc08681.png',
                'Dsc23481.png',
              ].includes(piece.file),
            ),
          },
        ]
      : project.name === 'L’Écluse Douze'
        ? []
        : [project],
);
export const logoAlias = 'CaptureDecran20261029A153342111.png';
export const canonicalLogo = 'CaptureDecran20261029A153342121.png';
export const photoSizes = { small: 123, medium: 222, large: 297 } as const;
export type PhotoSize = keyof typeof photoSizes;
export type ProjectMedia = {
  file: string;
  image: string | null;
  alt: string;
  project?: string | undefined;
  size?: PhotoSize | null | undefined;
  width?: number | undefined;
  height?: number | undefined;
};
export function clientPieces(
  project: VitrineProject,
  images: ProjectMedia[],
): Piece[] {
  return [
    ...project.pieces.map((piece) => sizedPiece(piece, images)),
    ...images
      .filter(
        (image) =>
          image.project === project.name &&
          !vitrineProjects.some((item) =>
            item.pieces.some((piece) => piece.file === image.file),
          ),
      )
      .map((image): Piece =>
        sizedPiece(
          {
            file: image.file,
            role: 'photo',
            width: image.width ?? 222,
            height: image.height ?? 333,
            alt: image.alt,
          },
          images,
        ),
      ),
  ];
}
export function sizedPiece(piece: Piece, images: ProjectMedia[]): Piece {
  const image = images.find((item) => item.file === piece.file);
  if (piece.role === 'name' || !image?.size) return piece;
  const width = photoSizes[image.size];
  return { ...piece, width, height: (width * piece.height) / piece.width };
}
export function layoutPieces(
  project: VitrineProject,
  images: ProjectMedia[],
): Piece[] {
  const owners = projectClients.filter((client) =>
    client.pieces.some((piece) =>
      project.pieces.some((slot) => slot.file === piece.file),
    ),
  );
  return [
    ...project.pieces.map((piece) => sizedPiece(piece, images)),
    ...owners.flatMap((client) =>
      clientPieces(client, images).filter(
        (piece) =>
          !client.pieces.some((original) => original.file === piece.file),
      ),
    ),
  ];
}
