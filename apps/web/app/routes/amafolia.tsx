import { Artwork } from '../components/vitrine/artwork';
import { ClientProjectFooter } from '../components/vitrine/client-project-footer';
import { ClientProjectNav } from '../components/vitrine/client-project-nav';
import { amafolia } from '../site';

const missions = [
  'Mission / Restructuration d’identité',
  'Création de contenus',
  'Identité visuelle',
  'Réseaux sociaux',
] as const;

export default function Amafolia({ homePath }: { homePath: string }) {
  return (
    <main id="contenu" className="client-project amafolia">
      <article aria-labelledby="amafolia-title">
        <header className="amafolia-intro">
          <ClientProjectNav homePath={homePath} />
          <h1 id="amafolia-title" className="project-sr-only">
            Amafolia
          </h1>
          <ul className="amafolia-missions" aria-label="Missions">
            {missions.map((mission) => (
              <li key={mission}>{mission}</li>
            ))}
          </ul>
          <Artwork
            className="amafolia-logo"
            file="amafolia/amafolia-logo.svg"
            width={755}
            height={307}
            alt="Amafolia, Italian Bar et Restaurant, depuis 2022"
            eager
          />
          <div className="amafolia-interventions">
            <ul aria-label="Interventions">
              <li>
                Accompagnement en stratégie, positionnement, audit et benchmark
              </li>
              <li>
                Création d’une identité visuelle et déclinaison du logo en
                divers supports
              </li>
              <li>Shooting photos et vidéos du restaurant</li>
              <li>Social media</li>
            </ul>
            <p>Pour @Ludovic.</p>
          </div>
          <p className="amafolia-presentation">
            Amafolia, un restaurant italien qui s’offre une nouvelle identité,
            plus brandée, entre la brasserie et la street food, entre traditions
            et modernité.
          </p>
        </header>
        <section aria-label="Identité visuelle">
          <Artwork
            file={amafolia.cover.file}
            width={1920}
            height={1119}
            sizes="100vw"
            alt={amafolia.cover.alt}
          />
          <Artwork
            file="amafolia/amafolia-signature.svg"
            width={1920}
            height={779}
            sizes="100vw"
            alt="Signature Amafolia en blanc sur fond bleu"
          />
        </section>
        <section aria-label="Reportage photographique">
          <Artwork
            file="amafolia/amafolia-reportage.webp"
            width={1920}
            height={2308}
            sizes="100vw"
            alt="Portrait en cuisine, tablier bleu, assiette marquée Amafolia et verre de cocktail"
          />
        </section>
        <section
          className="amafolia-applications"
          aria-label="Supports imprimés"
        >
          <Artwork
            className="amafolia-lettrage"
            file="amafolia/amafolia-lettrage.webp"
            width={680}
            height={239}
            sizes="(width < 1200px) 66vw, 34vw"
          />
          <p>
            Le contour du logo rappelle l’assiette de brasserie. Le pictogramme
            reprend la forme de la pizza et intègre le A d’Amafolia, utilisable
            comme tampon sur la carte de fidélité.
          </p>
          <Artwork
            className="amafolia-serviette"
            file="amafolia/amafolia-serviette.webp"
            width={491}
            height={523}
            sizes="(width < 1200px) 40vw, 26vw"
            alt="Serviette de table imprimée au nom d’Amafolia"
          />
          <Artwork
            className="amafolia-carte"
            file="amafolia/amafolia-carte.webp"
            width={888}
            height={808}
            sizes="(width < 1200px) 52vw, 46vw"
            alt="Carte de fidélité Amafolia avec des cases hexagonales et le tampon A"
          />
        </section>
        <Artwork
          file="amafolia/amafolia-couleurs.svg"
          width={1920}
          height={673}
          sizes="100vw"
          alt="Déclinaisons du lettrage Amafolia en bleu, crème, brun, vert et noir"
        />
        <Artwork
          className="amafolia-brasserie"
          file="amafolia/amafolia-brasserie.svg"
          width={1208}
          height={283}
          alt="Brasserie Italienne"
        />
        <ClientProjectFooter
          homePath={homePath}
          name={amafolia.name}
          description={amafolia.description}
        />
      </article>
    </main>
  );
}
