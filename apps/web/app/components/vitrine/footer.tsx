import { Artwork } from './artwork';

export function Footer() {
  return (
    <footer className="vitrine-footer">
      <div className="vitrine-footer-content">
        <Artwork file="LogoEpicc.png" width={256} height={189} alt="EPICC" />
        <a href="#prestations">Lancement de marque</a>
        <a href="#prestations">Stratégie de communication</a>
        <a href="#contenu">Retour en haut ↑</a>
      </div>
    </footer>
  );
}
