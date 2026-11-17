import { Artwork } from '../components/vitrine/artwork';
import { ClientProjectFooter } from '../components/vitrine/client-project-footer';
import { ClientProjectNav } from '../components/vitrine/client-project-nav';
import { viandesDesSommets } from '../site';

const missions = [
  'Mission / Lancement d’une nouvelle marque',
  'Création de contenus',
  'Identité visuelle',
  'Réseaux sociaux',
];

export default function ViandesDesSommets({ homePath }: { homePath: string }) {
  return (
    <main id="contenu" className="client-project viandes-des-sommets">
      <article aria-labelledby="vds-title">
        <header className="vds-intro">
          <ClientProjectNav homePath={homePath} />
          <h1 id="vds-title" className="project-sr-only">
            Viandes des Sommets
          </h1>
          <ul className="vds-missions" aria-label="Missions">
            {missions.map((mission) => (
              <li key={mission}>{mission}</li>
            ))}
          </ul>
          <Artwork
            className="vds-logo"
            file="viandes-des-sommets/vds-logo.webp"
            width={543}
            height={257}
            sizes="(width < 1200px) 80vw, 29vw"
            alt="Logo noir VDS avec une silhouette de montagne"
            eager
          />
          <div className="vds-interventions">
            <ul aria-label="Interventions">
              <li>
                Création d’une identité visuelle et déclinaison du logo en
                plusieurs supports
              </li>
              <li>
                Accompagnement en stratégie, positionnement et développement
                commercial
              </li>
              <li>Création de contenus, photos et vidéos</li>
              <li>Social media</li>
              <li>Organisation d’événements, tables et scénographie</li>
            </ul>
            <p>Pour @Arthur.</p>
          </div>
        </header>
        <section
          className="vds-feature"
          aria-label="Identité visuelle et packaging"
        >
          <Artwork
            file={viandesDesSommets.cover.file}
            width={1364}
            height={791}
            sizes="(width < 1200px) 96vw, 71vw"
            alt={viandesDesSommets.cover.alt}
          />
          <div className="vds-packaging">
            <Artwork
              className="vds-card"
              file="viandes-des-sommets/vds-carte.webp"
              width={534}
              height={329}
              sizes="(width < 1200px) 46vw, 28vw"
              alt="Carte rouge et blanche de Viandes des Sommets"
            />
            <Artwork
              className="vds-box"
              file="viandes-des-sommets/vds-coffret.webp"
              width={530}
              height={326}
              sizes="(width < 1200px) 46vw, 28vw"
              alt="Coffret Viandes des Sommets ouvert sur ses pièces de viande"
            />
            <Artwork
              className="vds-lettering"
              file="viandes-des-sommets/vds-lettrage.webp"
              width={648}
              height={321}
              sizes="(width < 1200px) 55vw, 34vw"
            />
            <p>
              Nous voulions créer une identité moderne pour cette sélection de
              viandes premium qui touche une cible précise, les restaurants et
              boucheries, sur un positionnement haut de gamme.
            </p>
          </div>
          <Artwork
            file="viandes-des-sommets/vds-tablier.webp"
            width={1362}
            height={742}
            sizes="(width < 1200px) 96vw, 71vw"
            alt="Plat de viande présenté par une personne portant le tablier rouge VDS"
          />
        </section>
        <section className="vds-construction" aria-label="Construction du logo">
          <p>
            Viandes des Sommets, c’est un regroupement d’éleveurs des Pyrénées.
            Il apparaissait donc naturel d’utiliser la symbolique de la
            montagne, dans laquelle les vaches transhument, pour mettre en
            valeur la race locale.
          </p>
          <Artwork
            file="viandes-des-sommets/vds-construction.webp"
            width={1920}
            height={773}
            sizes="100vw"
            alt="Déclinaisons rouges et grille de construction du logo VDS"
          />
        </section>
        <section
          className="vds-reportage"
          aria-label="L’art du bœuf et reportage photographique"
        >
          <p>
            Puis, j’ai continué mes armes chez Metro (on se rapproche de la
            restauration tout doucement…) en stratégie, puis sur la force de
            vente au contact direct des restaurateurs.
          </p>
          <Artwork
            file="viandes-des-sommets/vds-frise-noire.webp"
            width={1920}
            height={764}
            sizes="100vw"
            alt="Motif typographique noir L’art du bœuf"
          />
          <Artwork
            file="viandes-des-sommets/vds-reportage.webp"
            width={1920}
            height={1702}
            sizes="100vw"
            alt="Tampon rouge L’art du bœuf, grillades, repas en montagne et élevage dans les Pyrénées"
          />
        </section>
        <Artwork
          className="vds-frieze"
          file="viandes-des-sommets/vds-frise-rouge.svg"
          width={1341}
          height={484}
          alt="Motif typographique rouge L’art du bœuf"
        />
        <ClientProjectFooter
          homePath={homePath}
          name={viandesDesSommets.name}
          description={viandesDesSommets.description}
        />
      </article>
    </main>
  );
}
