import { Artwork } from './artwork';
import type { Offer } from '@epicc/content-contracts';

export function Services({ offers }: { offers: Offer[] }) {
  return (
    <section
      className="vitrine-services"
      id="prestations"
      aria-labelledby="services-title"
    >
      <h2 className="vitrine-sr-only" id="services-title">
        Les prestations
      </h2>
      <div className="vitrine-service-notes" aria-hidden="true">
        <span className="vitrine-evening">ce soir</span>
        <span className="vitrine-benchmark">Benchmark</span>
      </div>
      <dl>
        {offers.map(
          (
            { slug, name, summary, description, image, alt, sources },
            index,
          ) => (
            <div className="vitrine-service" key={slug} data-offer={slug}>
              <dt>
                <span className="vitrine-service-name">
                  {slug === 'creation-de-marque' &&
                  name === 'Lancement de marque' ? (
                    <>
                      Lancement de{' '}
                      <span className="vitrine-service-annotation">marque</span>
                    </>
                  ) : (
                    name
                  )}
                </span>
                {slug === 'restructuration-de-restaurants' && (
                  <span
                    className="vitrine-service-annotation"
                    aria-hidden="true"
                  >
                    Identité
                  </span>
                )}
                {summary && (
                  <span className="vitrine-service-summary">{summary}</span>
                )}
              </dt>
              <dd
                className={
                  slug === 'creation-de-marque' && summary
                    ? 'vitrine-sr-only'
                    : undefined
                }
              >
                {description}
              </dd>
              {image && (
                <dd
                  className={`vitrine-offer-visual ${index % 2 === 0 ? 'vitrine-offer-large' : 'vitrine-offer-small'}`}
                >
                  <Artwork
                    file=""
                    src={image}
                    sources={sources}
                    sizes={
                      index % 2 === 0
                        ? '(max-width: 900px) 85vw, (max-width: 1920px) 68.5vw, 1315px'
                        : '(max-width: 900px) 49vw, (max-width: 1920px) 39.7vw, 763px'
                    }
                    alt={alt}
                    width={960}
                    height={640}
                  />
                </dd>
              )}
            </div>
          ),
        )}
      </dl>
    </section>
  );
}
