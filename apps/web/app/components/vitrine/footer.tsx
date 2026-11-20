import { Artwork } from './artwork';

export function Footer() {
  return (
    <footer className="vitrine-footer">
      <div className="vitrine-footer-content">
        <Artwork
          file="epicc-logo-blanc.png"
          width={256}
          height={195}
          alt="EPICC"
          sizes="(max-width: 700px) 130px, (max-width: 1920px) 13.35vw, 256px"
        />
        <a href="#prestations">Lancement de marque</a>
        <a href="#prestations">Stratégie de communication</a>
        <a href="#contenu">Retour en haut ↑</a>
      </div>
    </footer>
  );
}
