import { Artwork } from './artwork';

const chapters = [
  'D’abord, j’ai commencé mon parcours en cabinet de conseil en stratégie : développer des méthodologies projet, d’analyse, se confronter à des contextes clients divers…',
  'Puis, j’ai continué mes armes chez Metro (on se rapproche de la restauration tout doucement…) en stratégie, puis sur la force de vente au contact direct des restaurateurs.\n\nJ’ai rencontré des chefs, commencé à développer mon réseau.',
  'La volonté d’entreprendre et de mettre les pieds dans la restauration s’est fait ressentir à mes 27 ans, après un tour du monde à la recherche des concepts et des tendances culinaires.',
  'Enfin, je me suis lancée dans la restauration : ouverture et direction de restaurants en tant que directrice, responsable de la communication et de l’événementiel.',
];

export function Biography() {
  return (
    <section
      className="vitrine-biography"
      id="a-propos"
      aria-labelledby="biography-title"
    >
      <header className="vitrine-biography-heading">
        <h2 id="biography-title">
          Salut, moi c’est <span className="vitrine-sr-only">Chloé Catala</span>
        </h2>
        <Artwork
          file="IllustrationSansTitre81.png"
          width={1701}
          height={398}
          alt="Chloé Catala"
          sizes="(max-width: 540px) 90vw, (max-width: 1920px) 46.15vw, 886px"
        />
      </header>
      <div className="vitrine-biography-intro">
        <p className="vitrine-sr-only">
          Quand j’étais toute petite,
          <br />
          je voulais <em>“être un restaurant”</em>
          <br />
          <br />
          Alors voilà l’histoire…
        </p>
        <figure className="vitrine-childhood">
          <Artwork
            file="WhatsAppImage20261029At0929261.jpg"
            width={537}
            height={954}
            alt="Chloé enfant, à table, une cuillère à la main."
            sizes="(max-width: 540px) 48vw, (max-width: 1920px) 28vw, 537px"
          />
          <div className="vitrine-childhood-strip" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={
                  index % 2 === 0
                    ? 'vitrine-childhood-strip-photo'
                    : 'vitrine-childhood-strip-rotated'
                }
              >
                <Artwork
                  file={
                    index % 2 === 0
                      ? 'projets-WhatsAppImage20261029At0954011.jpg'
                      : 'projets-WhatsAppImage20261029At09292611.jpg'
                  }
                  width={index % 2 === 0 ? 135 : 89.768}
                  height={index % 2 === 0 ? 90 : 159.446}
                />
              </span>
            ))}
          </div>
        </figure>
      </div>
      <div className="vitrine-chapters">
        {chapters.map((chapter) => (
          <p key={chapter}>{chapter}</p>
        ))}
      </div>
    </section>
  );
}
