import { Artwork } from './artwork';

export function Offers() {
  return (
    <section
      className="vitrine-offers"
      id="nos-offres"
      aria-labelledby="offers-title"
    >
      <h2 id="offers-title">Nos offres</h2>
      <div className="vitrine-offers-collage">
        <div className="vitrine-offers-still-life">
          <Artwork
            file="offres-nature-morte.webp"
            width={640}
            height={962}
            alt="Composition de plats et de boissons sur une table de restaurant."
          />
        </div>
        <div className="vitrine-offers-landscape">
          <Artwork
            file="offres-detail.webp"
            width={640}
            height={1131}
            alt="Assiette de viande dans un paysage de montagne."
          />
        </div>
        <div className="vitrine-offers-tomato">
          <Artwork
            file="offres-tomate.webp"
            width={640}
            height={816}
            alt="Gros plan sur une tomate rouge."
          />
        </div>
        <div className="vitrine-offers-meat">
          <Artwork
            file="offres-viande.webp"
            width={640}
            height={1016}
            alt="Pièce de viande grillée en gros plan."
          />
        </div>
        <div className="vitrine-offers-restaurant">
          <Artwork
            file="offres-restaurant.webp"
            width={640}
            height={960}
            alt="Table dressée dans la lumière chaleureuse d’un restaurant."
          />
        </div>
        <div className="vitrine-offers-blue">
          <Artwork
            file="offres-bleu.webp"
            width={640}
            height={960}
            alt="Texture d’un bleu intense."
          />
        </div>
        <div className="vitrine-offers-dish">
          <Artwork
            file="offres-assiette.webp"
            width={640}
            height={960}
            alt="Assiette d’anchois garnis de câpres et de ciboulette."
          />
        </div>
        <div className="vitrine-offers-golf">
          <Artwork
            file="offres-golf.webp"
            width={640}
            height={1137}
            alt="Accumulation de balles de golf blanches."
          />
        </div>
      </div>
    </section>
  );
}
