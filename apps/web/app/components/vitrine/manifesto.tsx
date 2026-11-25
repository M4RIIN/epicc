import { Artwork } from './artwork';
import { VitrineFilm } from './film';

export function Manifesto({ film }: { film: string | undefined }) {
  return (
    <section
      className="vitrine-manifesto"
      id="epicc"
      aria-labelledby="manifesto-title"
    >
      <h2 id="manifesto-title">Épicc, pourquoi ?</h2>
      <div className="vitrine-manifesto-portrait">
        <VitrineFilm
          source={film}
          file="portrait-manifeste.webp"
          width={1219}
          height={683}
          alt="Chloé à vélo dans les rues de Toulouse."
          floating
        />
      </div>
      <div className="vitrine-manifesto-intro">
        <p className="vitrine-manifesto-definition">
          {[
            'Épicc, pour épicurien.',
            'Épicc, pour épique.',
            'CC, pour Chloé Catala',
            'CC, pour conseil et communication',
          ].map((phrase) => (
            <span key={phrase}>
              {phrase}
              <span aria-hidden="true" className="vitrine-glitch-band">
                {phrase}
              </span>
              <span aria-hidden="true" className="vitrine-glitch-band">
                {phrase}
              </span>
            </span>
          ))}
        </p>
        <p>
          Né pour accompagner les acteurs de la restauration et de
          l’agroalimentaire pour faire exister, développer et faire connaître
          leur marque.
          <span className="vitrine-manifesto-purpose">
            Une ambition, aider des commerçants et des entrepreneurs qui ont des
            idées à les mettre en valeur au mieux.
            <br />
            Faire ressortir le beau, le bon, le bien de chaque projet que
            j’accompagne.
          </span>
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
          <span>Créée le 7 déc. 2025</span>
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
