import { Artwork, artworkPath } from './artwork';

export function Manifesto() {
  return (
    <section
      className="vitrine-manifesto"
      id="epicc"
      aria-labelledby="manifesto-title"
    >
      <h2 id="manifesto-title">EPICC, c’est quoi</h2>
      <div className="vitrine-manifesto-intro">
        <p>Pour moi EPICC c’est…</p>
        <p>
          Accompagner les acteurs de la restauration et de l’agroalimentaire
          pour faire exister et développer leur marque, même lorsque leur
          activité fonctionne déjà.
        </p>
      </div>
      <figure
        className="vitrine-manifesto-collage"
        aria-label="Du beau, du bon, du bien. Marque EPICC, créée le 20 septembre 2025 par Chloé Gathla."
      >
        <Artwork
          file="Rectangle2.png"
          width={742}
          height={419}
          className="vitrine-collage-paper"
        />
        <div className="vitrine-collage-photo">
          <Artwork file="Image29102026A17191.png" width={644} height={396} />
        </div>
        <Artwork
          file="12.png"
          width={701}
          height={316}
          className="vitrine-collage-bon"
        />
        <Artwork
          file="IllustrationSansTitre101.png"
          width={779}
          height={295}
          className="vitrine-collage-bien"
        />
        <Artwork
          file="IllustrationSansTitre401.png"
          width={931}
          height={305}
          className="vitrine-collage-beau"
        />
        <figcaption className="vitrine-colophon">
          <span>Marque EPICC</span>
          <svg viewBox="0 0 1 33" aria-hidden="true">
            <image
              href={`${artworkPath}Line8.svg`}
              width="33"
              height="1"
              transform="translate(1 0) rotate(90)"
            />
          </svg>
          <span>Créer le 20 sep 2025</span>
          <svg viewBox="0 0 1 33" aria-hidden="true">
            <image
              href={`${artworkPath}Line8.svg`}
              width="33"
              height="1"
              transform="translate(1 0) rotate(90)"
            />
          </svg>
          <span>Par</span>
          <Artwork
            file="IllustrationSansTitre81.png"
            width={1701}
            height={398}
            alt="Chloé Gathla"
          />
        </figcaption>
      </figure>
    </section>
  );
}
