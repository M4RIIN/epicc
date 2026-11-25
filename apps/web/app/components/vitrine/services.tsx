import { Artwork } from './artwork';
import { Tags } from './tags';
import { offers } from '../../content/offers';

const titles: Record<string, string[]> = {
  'creation-de-marque': ['ServiceLancement1.png', 'ServiceLancement2.png'],
  'restructuration-de-restaurants': ['ServiceRestructuration.png'],
  'video-photographe': ['ServiceContenus.png'],
  'reseaux-sociaux': ['ServiceReseaux.png'],
  graphisme: ['ServiceGraphisme.png'],
  evenementiel: [
    'ServiceEvenementiel.png',
    'ServiceReseaux.png',
    'ServiceScenographie.png',
  ],
};

const letteringDimensions: Record<string, [number, number]> = {
  'ServiceLancement1.png': [469, 204],
  'ServiceLancement2.png': [461, 204],
  'ServiceRestructuration.png': [750, 176],
  'ServiceReseaux.png': [389, 121],
  'ServiceContenus.png': [584, 102],
  'ServiceGraphisme.png': [288, 108],
  'ServiceEvenementiel.png': [424, 198],
  'ServiceScenographie.png': [348, 211],
};

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
        {offers.map(({ slug, name, skills, description }) => (
          <div className="vitrine-service" key={slug} data-offer={slug}>
            <dt>
              <span className="vitrine-service-name vitrine-sr-only">
                {name}
              </span>
              <span className="vitrine-service-lettering" aria-hidden="true">
                {titles[slug]!.map((file) => (
                  <Artwork
                    key={file}
                    file={file}
                    width={letteringDimensions[file]![0]}
                    height={letteringDimensions[file]![1]}
                  />
                ))}
              </span>
            </dt>
            <dd className="vitrine-service-skills">
              <Tags labels={skills} />
            </dd>
            <dd className="vitrine-service-description">{description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
