import type { CSSProperties } from 'react';
import { Artwork } from './artwork';
import { Tags } from './tags';
import { projects, type Piece, type Project } from '../../content/projects';

const MAQUETTE_WIDTH = 1920;

const containerWidth = (pixels: number) =>
  `${(pixels * 100) / MAQUETTE_WIDTH}cqw`;

const viewportWidth = (pixels: number) =>
  `${(pixels * 100) / MAQUETTE_WIDTH}vw`;

const projectLinkLabel = (name: string) =>
  `${name} — découvrir l’identité visuelle`;

function pieceStyle({ width, height }: Piece): CSSProperties {
  return {
    '--piece-width': containerWidth(width),
    '--piece-ratio': width / height,
  } as CSSProperties;
}

function projectRowStyle({ photos, label }: Project): CSSProperties {
  const [first, second = first] = photos;
  return {
    '--first-photo-width': containerWidth(first.width),
    '--second-photo-width': containerWidth(second.width),
    '--name-width': containerWidth(label?.lettering.width ?? 0),
  } as CSSProperties;
}

const mobileWidthByKind = { name: '29vw', photo: '23vw' };

function ProjectPiece({
  piece,
  kind,
  href,
  projectName,
}: {
  piece: Piece;
  kind: 'name' | 'photo';
  href: string | undefined;
  projectName: string;
}) {
  const alt = kind === 'name' ? projectName : (piece.alt ?? projectName);
  const artwork = (
    <Artwork
      sizes={`(max-width: 700px) ${mobileWidthByKind[kind]}, (max-width: 1920px) ${viewportWidth(piece.width)}, ${piece.width}px`}
      file={piece.file}
      width={piece.width}
      height={piece.height}
      alt={alt}
    />
  );
  return (
    <div
      data-file={piece.file}
      className={`vitrine-project-piece vitrine-project-${kind}`}
      style={pieceStyle(piece)}
    >
      {href ? (
        <a href={href} aria-label={projectLinkLabel(projectName)}>
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
  const { name, label, photos, side, page } = project;
  const href = page && basePath + page.path;
  return (
    <figure
      className="vitrine-project"
      data-project={name}
      data-side={side}
      data-photos={photos.length}
      style={projectRowStyle(project)}
      aria-label={name}
    >
      <figcaption className="vitrine-project-names">
        <h3 className="vitrine-sr-only">{name}</h3>
        {label && (
          <Tags
            labels={label.tags}
            lettering={
              <ProjectPiece
                piece={label.lettering}
                kind="name"
                href={href}
                projectName={name}
              />
            }
          />
        )}
      </figcaption>
      <div className="vitrine-project-photos">
        {photos.map((piece) => (
          <ProjectPiece
            key={piece.file}
            piece={piece}
            kind="photo"
            href={href}
            projectName={name}
          />
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
      <header className="vitrine-projects-header">
        <h2 id="projects-title">Les projets clients</h2>
      </header>
      <div className="vitrine-projects-viewport">
        <div
          className="vitrine-projects-collage"
          role="group"
          aria-label="Liste des projets clients"
          tabIndex={0}
        >
          {projects.map((project) => (
            <ProjectRow
              key={project.name}
              project={project}
              basePath={basePath}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
