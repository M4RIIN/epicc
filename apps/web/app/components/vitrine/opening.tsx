import { Link } from 'react-router';
import { Artwork } from './artwork';

export function Opening() {
  return (
    <section className="vitrine-opening" aria-label="Bienvenue chez EPICC">
      <div className="vitrine-cover">
        <Artwork
          file="AccueilChloe.png"
          width={1536}
          height={1024}
          alt="Chloé Catala, fondatrice d’EPICC."
          eager
          sizes="(max-width: 1920px) 100vw, 1920px"
        />
      </div>
      <Artwork
        file="Rectangle6.png"
        width={448}
        height={181}
        className="vitrine-opening-caption"
      />
      <nav className="vitrine-navigation" aria-label="Navigation principale">
        <details className="vitrine-menu">
          <summary>Menu</summary>
          <div className="vitrine-menu-panel">
            <a href="#prestations">Les prestations</a>
            <a href="#a-propos">À propos de Chloé</a>
            <a href="#epicc">L’esprit EPICC</a>
            <a href="#projets">Les projets clients</a>
            <a href="#contact">Contact</a>
            <Link to="/connect">Espace de gestion</Link>
          </div>
        </details>
        <div className="vitrine-navigation-actions">
          <div className="vitrine-navigation-sections">
            <a href="#a-propos">À propos</a>
            <a href="#prestations">Les offres</a>
            <a href="#projets">Projets clients</a>
          </div>
        </div>
      </nav>
    </section>
  );
}
