import type { CSSProperties } from 'react';
import type { Client } from '@epicc/content-contracts';

// Repère natif de l’export fourni : 1920 px de large, section à y = 4334.
// Les positions restent indépendantes entre les deux côtés, même après édition.
const profiles = [
  {
    side: 0,
    top: 236,
    caption: [158, 288, 503, 79],
    photos: [
      [737, 236, 222, 283],
      [839, 536, 120, 189],
      [785, 747, 177, 266],
      [715, 1039, 247, 371],
    ],
  },
  {
    side: 1,
    top: 169,
    caption: [1226, 153, 219, 81],
    photos: [
      [993, 169, 116, 173],
      [992, 364, 230, 405],
    ],
  },
  {
    side: 0,
    top: 1727,
    caption: [202, 1441, 416, 81],
    photos: [[674, 1727, 288, 432]],
  },
  {
    side: 1,
    top: 798,
    caption: [1381, 752, 315, 85],
    photos: [
      [993, 798, 297, 446],
      [993, 1272, 137, 244],
    ],
  },
  {
    side: 0,
    top: 2202,
    caption: [221, 2164, 410, 83],
    photos: [[721, 2202, 235, 352]],
  },
  {
    side: 1,
    top: 1543,
    caption: [1369, 1668, 180, 95],
    photos: [
      [993, 1543, 228, 418],
      [993, 2105, 285, 290],
    ],
  },
  { side: 0, top: 2902, caption: [336, 2902, 252, 80], photos: [] },
  { side: 1, top: 2674, caption: [1319, 2674, 270, 72], photos: [] },
  { side: 1, top: 3223, caption: [1311, 3223, 392, 107], photos: [] },
] as const;
const cycleHeight = 3634;
type ProjectStyle = CSSProperties & Record<`--${string}`, string | number>;

export function Projects({ clients }: { clients: Client[] }) {
  const extra = [0, 0];
  const projects = clients.map((client, index) => {
    const slot = index % profiles.length;
    const profile = profiles[slot]!;
    const cycle = Math.floor(index / profiles.length) * cycleHeight;
    const top = cycle + profile.top + extra[profile.side]!;
    const photos = [
      ...(client.image ? [{ image: client.image, alt: client.alt }] : []),
      ...client.gallery,
    ];
    let photoBottom = 0;
    const frames = photos.map((photo, photoIndex) => {
      const original = profile.photos[photoIndex] as
        readonly number[] | undefined;
      const x = original?.[0] ?? (profile.side === 0 ? 732 : 993);
      const y = original
        ? original[1]! - profile.top
        : photoIndex === 0
          ? 0
          : photoBottom + 24;
      const width = original?.[2] ?? 230;
      const height = original?.[3] ?? 345;
      photoBottom = Math.max(photoBottom, y + height);
      return { ...photo, x, y, width, height };
    });
    const [captionX, captionY, captionWidth, captionHeight] = profile.caption;
    const artwork =
      client.nameArtwork?.name === client.name ? client.nameArtwork : null;
    const caption = {
      x:
        artwork && profile.side === 0
          ? captionX + captionWidth - artwork.width
          : captionX,
      y: captionY - profile.top,
      width:
        artwork?.width ??
        Math.max(captionWidth, profile.side === 0 ? 500 : 410),
      height:
        artwork?.height ??
        Math.max(captionHeight, Math.ceil(client.name.length / 20) * 80),
    };
    const height = Math.max(photoBottom, caption.y + caption.height);
    const next = profiles
      .slice(slot + 1)
      .find((candidate) => candidate.side === profile.side);
    const available =
      (next?.top ??
        cycleHeight +
          profiles.find((candidate) => candidate.side === profile.side)!.top) -
      profile.top;
    extra[profile.side] =
      extra[profile.side]! + Math.max(0, height + 24 - available);
    return { client, top, height, frames, caption, artwork };
  });
  const contentHeight = Math.max(
    36,
    ...projects.map((project) => project.top + project.height),
  );
  const stageStyle: ProjectStyle = { '--projects-height': contentHeight + 304 };
  return (
    <section
      className="vitrine-projects"
      id="projets-clients"
      aria-labelledby="projects-title"
      style={stageStyle}
    >
      <h2 id="projects-title">
        <span className="vitrine-sr-only">Les projets clients</span>
        <img
          src="/images/projets/titre-projets.png"
          alt=""
          aria-hidden="true"
          width={282}
          height={27}
        />
      </h2>
      <div className="vitrine-projects-list">
        {projects.map(({ client, top, height, frames, caption, artwork }) => {
          const style: ProjectStyle = {
            '--project-top': top,
            '--project-height': height,
            scrollMarginTop: `calc(${Math.max(0, -caption.y)} * var(--project-unit) + 32px)`,
          };
          const captionStyle: ProjectStyle = {
            '--caption-x': caption.x,
            '--caption-y': caption.y,
            '--caption-width': caption.width,
            '--caption-height': caption.height,
          };
          return (
            <figure
              className="vitrine-project"
              id={`projet-${client.slug}`}
              key={client.slug}
              style={style}
            >
              <div className="vitrine-project-photos">
                {frames.map((photo, index) => {
                  const photoStyle: ProjectStyle = {
                    '--photo-x': photo.x,
                    '--photo-y': photo.y,
                    '--photo-width': photo.width,
                    '--photo-height': photo.height,
                  };
                  return (
                    <img
                      key={`${photo.image}:${index}`}
                      src={photo.image}
                      alt={photo.alt}
                      loading="lazy"
                      width={photo.width}
                      height={photo.height}
                      style={photoStyle}
                    />
                  );
                })}
              </div>
              <figcaption style={captionStyle}>
                <h3 className={artwork ? 'vitrine-sr-only' : undefined}>
                  {client.name}
                </h3>
                {artwork && (
                  <img
                    className="vitrine-project-name-artwork"
                    src={artwork.image}
                    alt=""
                    aria-hidden="true"
                    width={artwork.width}
                    height={artwork.height}
                    loading="lazy"
                  />
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
