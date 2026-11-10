import { Artwork } from './artwork';
import { useVitrineImageUrl } from './media';

export function Manifesto() {
  const line = useVitrineImageUrl('Line8.svg');
  return (
    <section
      className="vitrine-manifesto"
      id="epicc"
      aria-labelledby="manifesto-title"
    >
      <h2 id="manifesto-title">EPICC, c’est quoi</h2>
      <div className="vitrine-manifesto-intro">
        <p className="vitrine-manifesto-definition">
          Épicc, pour épicurien.
          <br />
          Épicc, pour épique.
          <br />
          CC, pour Chloé Catala.
          <br />
          CC, pour conseil et communication.
        </p>
        <p>
          Né pour accompagner les acteurs de la restauration et de
          l’agroalimentaire pour faire exister, développer et faire connaître
          leur marque.
        </p>
      </div>
      <figure
        className="vitrine-manifesto-collage"
        aria-label="Du beau, du bon, du bien. Marque EPICC, créée le 7 décembre 2025 par Chloé Catala."
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
              href={line}
              width="33"
              height="1"
              transform="translate(1 0) rotate(90)"
            />
          </svg>
          <span>Créée le 7 déc. 2025</span>
          <svg viewBox="0 0 1 33" aria-hidden="true">
            <image
              href={line}
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
            alt="Chloé Catala"
          />
        </figcaption>
      </figure>
    </section>
  );
}
