import type { CSSProperties } from 'react';
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

export function Projects({ images }: { images: ProjectImage[] }) {
  function renderPiece(piece: Piece, name: string) {
    const image = images.find((image) => image.file === piece.file);
    return (
      <div
        key={piece.file}
        data-file={piece.file}
        className={`vitrine-project-piece ${piece.role === 'name' ? 'vitrine-project-name' : 'vitrine-project-photo'} ${piece.crop ? 'vitrine-project-crop' : ''}`}
        style={pieceStyle(piece)}
      >
        <Artwork
          src={image?.image ?? null}
          file={`projets-${piece.file}`}
          width={piece.width}
          height={piece.height}
          alt={
            image?.alt ?? (piece.role === 'name' ? name : (piece.alt ?? name))
          }
          className={piece.mirror ? 'vitrine-project-mirror' : ''}
        />
      </div>
    );
  }
  function renderProject(name: string, pieces: Piece[]) {
    return (
      <figure className="vitrine-project" key={name} aria-label={name}>
        <figcaption className="vitrine-project-names">
          <h3 className="vitrine-sr-only">{name}</h3>
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
        <li>L’Écluse Douze · La Grinta</li>
        <li>Fitness by Leslie</li>
        <li>Allegria</li>
      </ul>
    </section>
  );
}
