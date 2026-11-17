import { Artwork } from './artwork';

export function Opening() {
  return (
    <section className="vitrine-opening" aria-label="Bienvenue chez EPICC">
      <div className="vitrine-cover">
        <Artwork
          file="OpeningSignature.png"
          width={1819}
          height={1019}
          alt="Chloé signe la vitrine d’un restaurant."
          eager
          sizes="96vw"
        />
        <Artwork
          file="LogoEpicc.png"
          width={300}
          height={222}
          alt="EPICC"
          className="vitrine-opening-logo"
        />
      </div>
      <nav className="vitrine-navigation" aria-label="Navigation principale">
        <details className="vitrine-menu">
          <summary>Menu</summary>
          <div className="vitrine-menu-panel">
            <a href="#prestations">Les prestations</a>
            <a href="#a-propos">À propos de Chloé</a>
            <a href="#epicc">L’esprit EPICC</a>
            <a href="#projets">Les projets clients</a>
            <a href="#contact">Contact</a>
          </div>
        </details>
        <div className="vitrine-navigation-actions">
          <div className="vitrine-navigation-sections">
            <a href="#a-propos">À propos</a>
            <a href="#prestations">Les expertises</a>
            <a href="#projets">Projets clients</a>
          </div>
        </div>
      </nav>
      <div className="vitrine-introduction">
        <Artwork
          file="OpeningPortrait.png"
          width={1378}
          height={772}
          alt="Chloé à la rencontre des restaurateurs, dans les rues de Toulouse."
          sizes="72vw"
        />
        <Artwork
          file="Rectangle6.png"
          width={244}
          height={133}
          className="vitrine-introduction-caption"
        />
      </div>
    </section>
  );
}
