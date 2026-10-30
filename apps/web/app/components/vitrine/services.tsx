import type { Offer } from '@epicc/content-contracts';
import { Artwork, artworkPath } from './artwork';

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
      <dl>
        {offers.map(({ slug, name, description }, index) => (
          <div className="vitrine-service" key={slug}>
            <dt>
              {['creation-de-marque', 'evenementiel'].includes(slug) ? (
                <>
                  <span className="vitrine-sr-only">{name}</span>
                  {slug === 'creation-de-marque' ? (
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
            {index < offers.length - 1 && (
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
