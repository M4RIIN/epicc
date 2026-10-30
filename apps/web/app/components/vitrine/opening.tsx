import { Link } from 'react-router';
import { Artwork } from './artwork';

export function Opening() {
  return (
    <section className="vitrine-opening" aria-label="Bienvenue chez EPICC">
      <div className="vitrine-cover">
        <Artwork
          file="Image29102026A17281.png"
          width={982}
          height={742}
          alt="Café renversé, tasse et sachets de sucre sur une table, dans une lumière granuleuse."
          sizes="(max-width: 540px) 157vw, 107vw"
          eager
        />
      </div>
      <Artwork
        file="opening-collage"
        width={1920}
        height={1395}
        className="vitrine-opening-art"
        sizes="(max-width: 540px) 147vw, 100vw"
        eager
      />
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
