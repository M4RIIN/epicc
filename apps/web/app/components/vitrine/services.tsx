import type { CSSProperties } from 'react';
import { Artwork } from './artwork';
import { offers } from '../../content/offers';

export function Services() {
  return (
    <section
      className="vitrine-services"
      id="prestations"
      aria-labelledby="services-title"
    >
      <h2 className="vitrine-sr-only" id="services-title">
        Les expertises
      </h2>
      <dl>
        {offers.map(({ slug, name, description, lettering, specialties }) => (
          <div className="vitrine-service" key={slug} data-offer={slug}>
            <dt
              style={
                {
                  '--lettering-width': `${lettering.width / 19.2}cqw`,
                } as CSSProperties
              }
            >
              <span className="vitrine-service-name vitrine-sr-only">
                {name}
              </span>
              <Artwork
                className="vitrine-service-lettering"
                file={`expertise-${lettering.file}.webp`}
                width={lettering.width}
                height={lettering.height}
              />
            </dt>
            <dd className="vitrine-service-description">{description}</dd>
            <dd className="vitrine-service-specialties">
              <ul aria-label="Spécialités">
                {specialties.map((specialty) => (
                  <li key={specialty}>{specialty}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
