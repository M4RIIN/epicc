import type { CSSProperties } from 'react';
import { Artwork } from './artwork';

import {
  vitrineProjects,
  type Piece,
  type ProjectImage,
} from '@epicc/content-contracts';

function pieceStyle(piece: Piece): CSSProperties {
  return {
    '--piece-x': `${piece.x / 19.2}%`,
    '--piece-y': `${(piece.y - 4466) / 19.2}cqw`,
    '--piece-width': `${piece.width / 19.2}%`,
    '--piece-height': `${piece.height / 19.2}cqw`,
    '--piece-ratio': piece.width / piece.height,
  } as CSSProperties;
}

export function Projects({ images }: { images: ProjectImage[] }) {
  return (
    <section
      className="vitrine-projects"
      id="projets"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title">Les projets clients</h2>
      <div className="vitrine-projects-collage">
        {vitrineProjects.map(({ name, pieces }) => (
          <figure className="vitrine-project" key={name} aria-label={name}>
            {pieces.map((piece, index) => (
              <div
                className={`vitrine-project-piece ${index === 0 ? 'vitrine-project-name' : ''} ${piece.crop ? 'vitrine-project-crop' : ''}`}
                style={pieceStyle(piece)}
                key={piece.file}
              >
                <Artwork
                  src={
                    images.find((image) => image.file === piece.file)?.image ??
                    null
                  }
                  file={`projets-${piece.file}`}
                  width={piece.width}
                  height={piece.height}
                  alt={
                    images.find((image) => image.file === piece.file)?.alt ??
                    (index === 0 ? name : (piece.alt ?? ''))
                  }
                  className={piece.mirror ? 'vitrine-project-mirror' : ''}
                />
              </div>
            ))}
          </figure>
        ))}
        <ul className="vitrine-project-notes" aria-label="Autres projets">
          <li className="vitrine-project-note-ecluse">
            L’Écluse Douze
            <br />
            La Grinta
          </li>
          <li className="vitrine-project-note-fitness">Fitness by Leslie</li>
          <li className="vitrine-project-note-allegria">Allegria</li>
        </ul>
      </div>
    </section>
  );
}
