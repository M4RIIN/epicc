import { Artwork, artworkPath } from './artwork';

const services = [
  {
    name: 'Création de marque',
    illustration: 'brand',
    description:
      'Création de l’identité visuelle, positionnement, stratégie de communication et mise en valeur des produits et des établissements',
  },
  {
    name: 'Restructuration de restaurants',
    description:
      'Accompagnement stratégique, audit, refonte de l’identité et optimisation de la communication pour établissement existant',
  },
  {
    name: 'Réseaux sociaux',
    description: 'Community management, animation réseaux sociaux',
  },
  {
    name: 'Événementiel',
    illustration: 'events',
    description:
      'Organisation et gestion de la communication d’événements sur mesure (soirées de networking ou lancement), scénographie de tables, recherche de traiteurs et de prestataires',
  },
  {
    name: 'Vidéo & photographe',
    description:
      'Identité visuelle (création de logo, iconographie…), chartes graphiques et autres supports de communication, packaging, affiches',
  },
];

export function Services() {
  return (
    <section
      className="vitrine-services"
      id="prestations"
      aria-labelledby="services-title"
    >
      <h2 className="vitrine-sr-only" id="services-title">
        Les prestations
      </h2>
      <dl>
        {services.map(({ name, illustration, description }, index) => (
          <div className="vitrine-service" key={name}>
            <dt>
              {illustration ? (
                <>
                  <span className="vitrine-sr-only">{name}</span>
                  {illustration === 'brand' ? (
                    <span className="vitrine-brand-label" aria-hidden="true">
                      <Artwork file="Rectangle3.png" width={662} height={369} />
                      <Artwork file="Rectangle4.png" width={650} height={370} />
                    </span>
                  ) : (
                    <Artwork
                      file="Rectangle1.png"
                      width={1150}
                      height={332}
                      className="vitrine-event-label"
                    />
                  )}
                </>
              ) : (
                name
              )}
            </dt>
            <dd>{description}</dd>
            {index < services.length - 1 && (
              <svg
                className="vitrine-service-rule"
                viewBox="0 0 1315 1"
                aria-hidden="true"
              >
                <image
                  href={`${artworkPath}Line4.svg`}
                  width="1315"
                  height="1"
                />
              </svg>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
