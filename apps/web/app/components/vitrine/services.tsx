import { Artwork } from './artwork';
import type { Offer } from '@epicc/content-contracts';

const titles: Record<string, { name: string; files: string[] }> = {
  'creation-de-marque': {
    name: 'Lancement de marque',
    files: ['Rectangle7.png', 'Rectangle8.png'],
  },
  'restructuration-de-restaurants': {
    name: 'Restructuration d’identité',
    files: ['IllustrationSansTitre663.png'],
  },
  'video-photographe': {
    name: 'Création de contenus visuels',
    files: ['IllustrationSansTitre676.png'],
  },
  'reseaux-sociaux': {
    name: 'Réseaux sociaux',
    files: ['IllustrationSansTitre681.png'],
  },
  graphisme: { name: 'Graphisme', files: ['IllustrationSansTitre691.png'] },
  evenementiel: {
    name: 'Événementiel & scénographie',
    files: ['IllustrationSansTitre665.png', 'IllustrationSansTitre6721.png'],
  },
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
                          width={500}
                          height={140}
                        />
                      ))}
                    </span>
                  )}
                  {summary && (
                    <span className="vitrine-service-summary">{summary}</span>
                  )}
                </dt>
                <dd className="vitrine-service-description">{intro}</dd>
                {details && (
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
