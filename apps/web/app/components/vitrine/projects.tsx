import type { CSSProperties } from 'react';
import type { Client } from '@epicc/content-contracts';

// Mesures de la capture de référence, ramenées à une largeur de page de 680.
// Chaque colonne avance indépendamment : aucun alignement par rangée.
const compositions = [
  {
    offset: 21,
    horizontal: 18,
    space: 13,
    photos: [
      [79, 101, 0],
      [43, 67, 6],
      [62, 95, 8],
      [87, 130, 9],
    ],
  },
  {
    offset: 1,
    horizontal: -52,
    space: 11,
    photos: [
      [41, 61, 0],
      [81, 143, 8],
      [57, 92, 8],
      [81, 103, 8],
    ],
  },
  {
    offset: 1,
    horizontal: 0,
    space: 14,
    photos: [
      [57, 92, 0],
      [101, 153, 9],
      [62, 95, 8],
      [87, 130, 8],
    ],
  },
  {
    offset: -15,
    horizontal: 0,
    space: 11,
    photos: [
      [105, 158, 0],
      [49, 86, 10],
      [81, 103, 8],
      [57, 92, 8],
    ],
  },
  {
    offset: -7,
    horizontal: 8,
    space: 14,
    photos: [
      [83, 125, 0],
      [57, 92, 8],
      [79, 101, 8],
      [43, 67, 8],
    ],
  },
  {
    offset: 47,
    horizontal: 0,
    space: 13,
    photos: [
      [81, 147, 0],
      [101, 103, 51],
      [57, 92, 8],
      [81, 103, 8],
    ],
  },
];
type ProjectStyle = CSSProperties & Record<`--${string}`, string | number>;

export function Projects({ clients }: { clients: Client[] }) {
  const nextRow = [24, 1];
  return (
    <section
      className="vitrine-projects"
      id="projets-clients"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title">Les projets clients</h2>
      <div className="vitrine-projects-list">
        {clients.map((client, index) => {
          const side = index % 2;
          const composition = compositions[index % compositions.length]!;
          const photos = [
            { image: client.image, alt: client.alt },
            ...client.gallery,
          ];
          const height = photos.reduce((sum, _, photoIndex) => {
            const [, photoHeight, gap] = composition.photos[photoIndex]!;
            return sum + photoHeight! + gap!;
          }, 0);
          // Les noms très longs restent lisibles sans empiéter sur le projet suivant.
          const rows = Math.ceil(
            Math.max(
              height,
              Math.ceil(client.name.length / 18) * 27 +
                Math.max(0, composition.offset),
            ) + composition.space,
          );
          const start = nextRow[side]!;
          nextRow[side] = start + rows;
          const style: ProjectStyle = {
            gridRow: `${start} / span ${rows}`,
            '--caption-offset': composition.offset,
            '--caption-x': composition.horizontal,
          };
          return (
            <figure
              className={`vitrine-project vitrine-project-${side === 0 ? 'left' : 'right'}${client.name.length > 24 ? ' vitrine-project-long-name' : ''}`}
              id={`projet-${client.slug}`}
              key={client.slug}
              style={style}
            >
              <div className="vitrine-project-photos">
                {photos.map((photo, photoIndex) => {
                  const [width, photoHeight, gap] =
                    composition.photos[photoIndex]!;
                  const photoStyle: ProjectStyle = {
                    '--photo-width': width!,
                    '--photo-height': photoHeight!,
                    '--photo-gap': gap!,
                  };
                  return (
                    <img
                      key={`${photo.image}:${photoIndex}`}
                      src={photo.image}
                      alt={photo.alt}
                      loading="lazy"
                      width={width}
                      height={photoHeight}
                      style={photoStyle}
                    />
                  );
                })}
              </div>
              <figcaption>
                <h3>{client.name}</h3>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
