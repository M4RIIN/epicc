import { Artwork } from './artwork';
import { offers } from '../../content/offers';
import {
  serviceTooltips,
  type TooltipArtwork,
} from '../../content/service-tooltips';

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

function TooltipImage({
  artwork: [name, width, height],
  className,
}: {
  artwork: TooltipArtwork;
  className?: string;
}) {
  return (
    <Artwork
      file={`infobulles/infobulle-${name}.png`}
      width={width}
      height={height}
      sizes="(max-width: 650px) 90vw, 625px"
      {...(className && { className })}
    />
  );
}

function ServiceTooltip({ slug }: { slug: keyof typeof serviceTooltips }) {
  const { title, subtitle, details, description } = serviceTooltips[slug];
  return (
    <span
      className="vitrine-service-tooltip"
      id={`infobulle-${slug}`}
      role="tooltip"
    >
      <span className="vitrine-sr-only">{description}</span>
      <TooltipImage
        artwork={['cadre', 1249, 342]}
        className="vitrine-service-tooltip-frame"
      />
      <span className="vitrine-service-tooltip-title">
        {title.map((artwork) => (
          <TooltipImage key={artwork[0]} artwork={artwork} />
        ))}
      </span>
      <span className="vitrine-service-tooltip-details">
        {subtitle && <TooltipImage artwork={subtitle} />}
        <TooltipImage artwork={details} />
      </span>
    </span>
  );
}

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
        {offers.map(({ slug, name, description }) => (
          <div className="vitrine-service" key={slug} data-offer={slug}>
            <dt tabIndex={0} aria-describedby={`infobulle-${slug}`}>
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
            <dd className="vitrine-service-description">
              {description}
              <ServiceTooltip slug={slug} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
