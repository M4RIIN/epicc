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
          sizes="(max-width: 700px) 96px, (max-width: 1920px) 8.5vw, 164px"
        />
      </div>
    </footer>
  );
}
