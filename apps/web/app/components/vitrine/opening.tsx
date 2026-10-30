import { Link } from 'react-router';
import { Artwork, artworkPath } from './artwork';

// Coordonnées du collage dans le repère Figma ; le viewBox conserve les proportions.
const illustrations = [
  [657.1, 430.75, 114.082, 94.5973],
  [750.8, 433.55, 129.721, 96.1133],
  [839.89, 540.82, 111.876, 138.255],
  [696.66, 596.5, 106.096, 83.3152],
  [556.28, 523.59, 129.497, 63.2699],
  [701.29, 497.44, 105.773, 80.3355],
  [735.24, 809.34, 129.713, 94.7622],
  [590.19, 594.76, 116.048, 74.4749],
  [829, 777.32, 78.912, 54.1887],
  [867.6, 708.62, 70.4246, 64.3214],
  [614.91, 725.62, 111.941, 138.113],
  [705.66, 715.8, 129.512, 63.2597],
  [681.87, 831.44, 76.734, 100.787],
  [610.84, 674.52, 71.6343, 54.6558],
  [518.32, 647.32, 111.873, 138.185],
  [905.34, 679.64, 77.0141, 172.773],
  [779.72, 642.43, 105.781, 80.3356],
];

export function Opening() {
  return (
    <section className="vitrine-opening" aria-label="Bienvenue chez EPICC">
      <div className="vitrine-cover">
        <Artwork
          file="Image29102026A17281.png"
          width={982}
          height={742}
          alt="Café renversé, tasse et sachets de sucre sur une table, dans une lumière granuleuse."
          eager
        />
      </div>
      <svg
        className="vitrine-opening-art"
        viewBox="0 0 1920 1395"
        aria-hidden="true"
        focusable="false"
      >
        <g opacity="0.5">
          {illustrations.map(([x, y, width, height], index) => (
            <image
              key={index}
              href={`${artworkPath}Group${index || ''}.svg`}
              x={0}
              y={0}
              width={width}
              height={height}
              transform={`translate(${x} ${y}) rotate(4.56) skewX(3.64)`}
            />
          ))}
          <image
            href={`${artworkPath}Rectangle.png`}
            x="0"
            y="0"
            width="96.33"
            height="108.08"
            transform="translate(661.69 397.35) rotate(4.58) skewX(3.66)"
          />
        </g>
      </svg>
      <nav className="vitrine-navigation" aria-label="Navigation principale">
        <details className="vitrine-menu">
          <summary>Menu</summary>
          <div className="vitrine-menu-panel">
            <a href="#prestations">Les prestations</a>
            <a href="#a-propos">À propos de Chloé</a>
            <a href="#epicc">L’esprit EPICC</a>
            <Link to="/clients">Les rencontres</Link>
            <Link to="/connect">Espace de gestion</Link>
          </div>
        </details>
        <div className="vitrine-navigation-actions">
          <Link to="/connect" className="vitrine-connect">
            Connexion <span aria-hidden="true">↗</span>
          </Link>
          <div className="vitrine-navigation-sections">
            <a href="#prestations" aria-label="Menu — Les prestations">
              Menu
            </a>
            <a href="#a-propos" aria-label="Menu — À propos">
              Menu
            </a>
            <a href="#epicc" aria-label="Menu — EPICC, c’est quoi">
              Menu
            </a>
          </div>
        </div>
      </nav>
    </section>
  );
}
