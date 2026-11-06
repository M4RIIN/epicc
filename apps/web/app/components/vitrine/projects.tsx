import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Artwork } from './artwork';
import {
  vitrineProjects,
  layoutPieces,
  projectClients,
  clientPieces,
  projectSides,
  type Piece,
  type ProjectImage,
} from '@epicc/content-contracts';

function pieceStyle(piece: Piece): CSSProperties {
  return {
    '--piece-width': `${piece.width / 19.2}cqw`,
    '--piece-ratio': piece.width / piece.height,
  } as CSSProperties;
}

// Les identifiants de gestion restent stables pour les visuels déjà téléversés.
const displayNames: Record<string, string> = {
  'Viande des Sorgues': 'Viandes des Sommets',
  Annafurna: 'Amafolia',
  'Deux Mnu': 'Deux Main',
  'L’Écluse Douze — Deux Mnu': 'L’Écluse Douze — Deux Main',
};

export function Projects({ images }: { images: ProjectImage[] }) {
  function renderPiece(piece: Piece, name: string) {
    const image = images.find((image) => image.file === piece.file);
    const artwork = (
      <Artwork
        src={image?.image ?? null}
        sources={image?.sources}
        sizes={`(max-width: 700px) ${piece.role === 'name' ? 52 : 33}vw, (max-width: 1920px) ${piece.width / 19.2}vw, ${piece.width}px`}
        file={`projets-${piece.file}`}
        width={piece.width}
        height={piece.height}
        alt={
          image?.alt && image.alt !== name
            ? (displayNames[image.alt] ?? image.alt)
            : piece.role === 'name'
              ? (displayNames[name] ?? name)
              : (piece.alt ?? name)
        }
        className={piece.mirror ? 'vitrine-project-mirror' : ''}
      />
    );
    return (
      <div
        key={piece.file}
        data-file={piece.file}
        className={`vitrine-project-piece ${piece.role === 'name' ? 'vitrine-project-name' : 'vitrine-project-photo'} ${piece.crop ? 'vitrine-project-crop' : ''}`}
        style={pieceStyle(piece)}
      >
        {name === 'Viande des Sorgues' ? (
          <Link
            to="/clients/viandes-des-sommets"
            aria-label="Viandes des Sommets — découvrir l’identité visuelle"
          >
            {artwork}
          </Link>
        ) : (
          artwork
        )}
      </div>
    );
  }
  function renderProject(name: string, pieces: Piece[]) {
    return (
      <figure
        className="vitrine-project"
        key={name}
        data-project={name}
        aria-label={displayNames[name] ?? name}
      >
        <figcaption className="vitrine-project-names">
          <h3 className="vitrine-sr-only">{displayNames[name] ?? name}</h3>
          {pieces
            .filter((piece) => piece.role === 'name')
            .map((piece) => renderPiece(piece, name))}
        </figcaption>
        <div className="vitrine-project-photos">
          {pieces
            .filter((piece) => piece.role === 'photo')
            .map((piece) => renderPiece(piece, name))}
        </div>
      </figure>
    );
  }
  return (
    <section
      className="vitrine-projects"
      id="projets"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title">Les projets clients</h2>
      <div className="vitrine-projects-collage">
        {projectSides.map((side) => (
          <div
            key={side}
            className={`vitrine-project-column vitrine-project-column-${side}`}
            data-side={side}
          >
            {vitrineProjects
              .filter((project) => project.side === side)
              .map((project) => {
                const { name } = project;
                const pieces = layoutPieces(project, images);
                if (
                  project.pieces.filter((piece) => piece.role === 'name')
                    .length > 1 &&
                  pieces.some((piece) => piece.role === 'photo')
                ) {
                  const clients = projectClients.filter((client) =>
                    client.pieces.some((piece) =>
                      project.pieces.some((slot) => slot.file === piece.file),
                    ),
                  );
                  return (
                    <div className="vitrine-project-group" key={name}>
                      {clients.map((client) =>
                        renderProject(
                          client.name,
                          clientPieces(client, images),
                        ),
                      )}
                    </div>
                  );
                }
                return renderProject(name, pieces);
              })}
          </div>
        ))}
      </div>
      <ul className="vitrine-project-notes" aria-label="Autres projets">
        <li>
          L’Écluse Douze
          <br />
          La Grinta
        </li>
        <li>Fitness by Leslie</li>
        <li>Allegria</li>
      </ul>
    </section>
  );
}
