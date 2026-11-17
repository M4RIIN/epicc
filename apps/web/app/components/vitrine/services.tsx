import { Artwork } from './artwork';
import type { Offer } from '@epicc/content-contracts';

const titles: Record<string, { name: string; files: string[] }> = {
  'creation-de-marque': {
    name: 'Lancement de marque',
    files: ['ServiceLancement1.png', 'ServiceLancement2.png'],
  },
  'restructuration-de-restaurants': {
    name: 'Restructuration d’identité',
    files: ['ServiceRestructuration.png'],
  },
  'video-photographe': {
    name: 'Création de contenus visuels',
    files: ['ServiceContenus.png'],
  },
  'reseaux-sociaux': {
    name: 'Réseaux sociaux',
    files: ['ServiceReseaux.png'],
  },
  graphisme: { name: 'Graphisme', files: ['ServiceGraphisme.png'] },
  evenementiel: {
    name: 'Événementiel & scénographie',
    files: [
      'ServiceEvenementiel.png',
      'ServiceReseaux.png',
      'ServiceScenographie.png',
    ],
  },
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
        {offers.map(
          ({
            slug,
            name,
            summary,
            description,
            image,
            alt,
            sources,
            hoverImage,
            hoverAlt,
            hoverSources,
          }) => {
            const title = titles[slug];
            const illustrated = title?.name === name;
            const [intro, ...paragraphs] = description.split('\n\n');
            const details = paragraphs.join('\n\n');
            return (
              <div
                className="vitrine-service"
                key={slug}
                data-offer={slug}
                tabIndex={hoverImage ? 0 : undefined}
                aria-label={hoverImage ? name : undefined}
              >
                <dt>
                  <span
                    className={`vitrine-service-name ${illustrated ? 'vitrine-sr-only' : ''}`}
                  >
                    {name}
                  </span>
                  {illustrated && (
                    <span
                      className="vitrine-service-lettering"
                      aria-hidden="true"
                    >
                      {title.files.map((file) => (
                        <Artwork
                          key={file}
                          file={file}
                          width={letteringDimensions[file]![0]}
                          height={letteringDimensions[file]![1]}
                        />
                      ))}
                    </span>
                  )}
                  {!illustrated && summary && (
                    <span className="vitrine-service-summary">{summary}</span>
                  )}
                </dt>
                <dd className="vitrine-service-description">{intro}</dd>
                {!illustrated && details && (
                  <dd className="vitrine-service-details">{details}</dd>
                )}
                {hoverImage && (
                  <dd className="vitrine-offer-hover">
                    <Artwork
                      file=""
                      src={hoverImage}
                      sources={hoverSources}
                      sizes="(max-width: 700px) 70vw, 24vw"
                      alt={hoverAlt ?? ''}
                      width={480}
                      height={300}
                    />
                  </dd>
                )}
                {image && (
                  <dd className="vitrine-offer-visual">
                    <Artwork
                      file=""
                      src={image}
                      sources={sources}
                      sizes="(max-width: 700px) 85vw, 30vw"
                      alt={alt}
                      width={960}
                      height={640}
                    />
                  </dd>
                )}
              </div>
            );
          },
        )}
      </dl>
    </section>
  );
}
