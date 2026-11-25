import { Artwork } from './artwork';

export function Footer() {
  return (
    <footer className="vitrine-footer">
      <div className="vitrine-footer-content">
        <a href="#contenu" aria-label="EPICC, retour en haut">
          <Artwork
            file="LogoEpicc.png"
            width={256}
            height={189}
            sizes="(max-width: 700px) 130px, (max-width: 1920px) 13.35vw, 256px"
          />
        </a>
      </div>
    </footer>
  );
}
