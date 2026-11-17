import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Artwork } from './artwork';
import {
  showcaseClientNames,
  projectClients,
  clientPieces,
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

// Le placement suit la maquette ; les groupes historiques de gestion restent stables.
const displaySides: Record<string, 'left' | 'right'> = {
  Allegria: 'left',
  'L’Écluse Douze': 'right',
};

export function Projects({ images }: { images: ProjectImage[] }) {
  function renderPiece(piece: Piece, name: string) {
    const image = images.find((image) => image.file === piece.file);
    const artwork = (
      <Artwork
        src={image?.image ?? null}
        sources={image?.sources}
        sizes={`(max-width: 700px) ${piece.role === 'name' ? 29 : 23}vw, (max-width: 1920px) ${piece.width / 19.2}vw, ${piece.width}px`}
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
  function renderProject(
    name: string,
    pieces: Piece[],
    side: 'left' | 'right',
  ) {
    const photos = pieces.filter((piece) => piece.role === 'photo');
    const lettering = pieces.find((piece) => piece.role === 'name');
    const style = {
      '--first-photo-width': `${(photos[0]?.width ?? 0) / 19.2}cqw`,
      '--second-photo-width': `${(photos[1]?.width ?? 0) / 19.2}cqw`,
      '--project-name-width': `${(lettering?.width ?? 300) / 19.2}cqw`,
    } as CSSProperties;
    return (
      <figure
        className="vitrine-project"
        key={name}
        data-project={name}
        data-side={side}
        style={style}
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
        {projectClients
          .filter((client) => showcaseClientNames.includes(client.name))
          .map((client) =>
            renderProject(
              client.name,
              clientPieces(client, images)
                .filter((piece) => piece.role === 'name')
                .concat(
                  clientPieces(client, images)
                    .filter((piece) => piece.role === 'photo')
                    .slice(0, 2),
                ),
              displaySides[client.name] ?? client.side,
            ),
          )}
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
    </section>
  );
}
