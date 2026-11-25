import type { CSSProperties } from 'react';
import { Artwork } from './artwork';
import { projects, type Project } from '../../content/projects';

const canvasWidth = 1920;

function designLength(pixels: number, unit: 'cqw' | 'vw' = 'cqw') {
  return `${(pixels / canvasWidth) * 100}${unit}`;
}

type ProjectPhoto = NonNullable<Project['photos'][number]>;
type Caption = NonNullable<Project['caption']>;

function ProjectCaption({ caption }: { caption: Caption }) {
  return (
    <div className="vitrine-project-cartouche">
      <span>{caption.service}</span>
      <span>{caption.date}</span>
      <Artwork
        className="vitrine-project-lettering"
        file={`projets-${caption.lettering}`}
        width={caption.width}
        height={caption.height}
      />
    </div>
  );
}

function ProjectImage({
  photo,
  link,
}: {
  photo: ProjectPhoto;
  link: { href: string; label: string } | undefined;
}) {
  const artwork = (
    <Artwork
      file={photo.file}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      sizes={`(max-width: 900px) 43vw, (max-width: 1920px) ${designLength(photo.width, 'vw')}, ${photo.width}px`}
    />
  );
  return (
    <div
      className="vitrine-project-photo"
      style={
        {
          '--photo-width': designLength(photo.width),
          '--photo-ratio': photo.width / photo.height,
          '--photo-top': designLength(photo.top ?? 0),
          '--photo-inset': designLength(photo.inset ?? 0),
        } as CSSProperties
      }
    >
      {link ? (
        <a href={link.href} aria-label={link.label} tabIndex={-1}>
          {artwork}
        </a>
      ) : (
        artwork
      )}
    </div>
  );
}

function ProjectRow({
  project,
  basePath,
}: {
  project: Project;
  basePath: string;
}) {
  const { name, side, page, photos, caption, height } = project;
  const link = page && {
    href: basePath + page.path,
    label: `${name} — découvrir l’identité visuelle`,
  };
  const adjacentPhoto = photos[side === 'left' ? 0 : 1];
  return (
    <figure
      className="vitrine-project"
      data-side={side}
      data-project={name}
      aria-label={name}
      style={
        {
          '--project-height': designLength(height),
          '--project-caption-top': designLength(caption?.top ?? 0),
          '--project-lettering-width': designLength(caption?.width ?? 0),
          '--project-caption-inset': designLength(
            adjacentPhoto
              ? adjacentPhoto.width + (adjacentPhoto.inset ?? 0)
              : 255,
          ),
        } as CSSProperties
      }
    >
      <figcaption
        className={caption ? 'vitrine-project-names' : 'vitrine-sr-only'}
      >
        <h3 className="vitrine-sr-only">{name}</h3>
        {caption &&
          (link ? (
            <a href={link.href} aria-label={link.label}>
              <ProjectCaption caption={caption} />
            </a>
          ) : (
            <ProjectCaption caption={caption} />
          ))}
      </figcaption>
      <div className="vitrine-project-photos">
        {photos.map((photo, index) => (
          <div
            className="vitrine-project-lane"
            data-lane={index === 0 ? 'left' : 'right'}
            key={photo?.file ?? 'empty'}
          >
            {photo && <ProjectImage photo={photo} link={link} />}
          </div>
        ))}
      </div>
      {page && (
        <div className="vitrine-project-preview" aria-hidden="true">
          <Artwork
            file={page.previewFile}
            width={300}
            height={180}
            sizes="(max-width: 1154px) 26vw, 300px"
          />
        </div>
      )}
    </figure>
  );
}

export function Projects({ basePath }: { basePath: string }) {
  return (
    <section
      className="vitrine-projects"
      id="projets"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title">Les projets clients</h2>
      <div className="vitrine-projects-collage">
        {projects.map((project) => (
          <ProjectRow
            key={project.name}
            project={project}
            basePath={basePath}
          />
        ))}
      </div>
    </section>
  );
}
