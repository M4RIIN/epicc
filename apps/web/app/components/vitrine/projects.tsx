import type { CSSProperties } from 'react';
import { Artwork } from './artwork';
import { projects, type Piece, type Project } from '../../content/projects';

function pieceStyle(piece: Piece): CSSProperties {
  return {
    '--piece-width': `${piece.width / 19.2}cqw`,
    '--piece-ratio': piece.width / piece.height,
  } as CSSProperties;
}

export function Projects({ basePath }: { basePath: string }) {
  function renderPiece(piece: Piece, name: string, href?: string) {
    const artwork = (
      <Artwork
        sizes={`(max-width: 700px) ${piece.role === 'name' ? 29 : 23}vw, (max-width: 1920px) ${piece.width / 19.2}vw, ${piece.width}px`}
        file={`projets-${piece.file}`}
        width={piece.width}
        height={piece.height}
        alt={piece.role === 'name' ? name : (piece.alt ?? name)}
        className={piece.mirror ? 'vitrine-project-mirror' : ''}
      />
    );
    return (
      <div
        key={piece.file}
        data-file={piece.file}
        className={`vitrine-project-piece ${piece.role === 'name' ? 'vitrine-project-name' : 'vitrine-project-photo'}`}
        style={pieceStyle(piece)}
      >
        {href ? (
          <a href={href} aria-label={`${name} — découvrir l’identité visuelle`}>
            {artwork}
          </a>
        ) : (
          artwork
        )}
      </div>
    );
  }
  function renderProject({ name, lettering, photos, side, page }: Project) {
    const href = page && basePath + page.path;
    const style = {
      '--first-photo-width': `${(photos[0]?.width ?? 0) / 19.2}cqw`,
      '--second-photo-width': `${(photos[1]?.width ?? 0) / 19.2}cqw`,
      '--project-name-width': `${lettering.width / 19.2}cqw`,
    } as CSSProperties;
    return (
      <figure
        className="vitrine-project"
        key={name}
        data-project={name}
        data-side={side}
        style={style}
        aria-label={name}
      >
        <figcaption className="vitrine-project-names">
          <h3 className="vitrine-sr-only">{name}</h3>
          {renderPiece(lettering, name, href)}
        </figcaption>
        <div className="vitrine-project-photos">
          {photos.map((piece) => renderPiece(piece, name, href))}
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
          {projects.map(renderProject)}
          <figure
            className="vitrine-project vitrine-project-fitness-row"
            aria-label="Fitness by Leslie"
            data-side="left"
            style={
              {
                '--first-photo-width': `${338 / 19.2}cqw`,
                '--second-photo-width': `${352 / 19.2}cqw`,
                '--project-name-width': '16cqw',
              } as CSSProperties
            }
          >
            <figcaption className="vitrine-project-names">
              <h3>Fitness by Leslie</h3>
            </figcaption>
            <div className="vitrine-project-photos">
              <Artwork
                file="Fitness1.png"
                width={338}
                height={425}
                alt="Séance de renforcement avec haltères, Fitness by Leslie."
              />
              <Artwork
                file="Fitness2.png"
                width={352}
                height={441}
                alt="Séance de fitness avec ballon, Fitness by Leslie."
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
