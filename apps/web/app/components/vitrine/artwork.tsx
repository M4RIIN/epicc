import type { ResponsiveImageSource } from '@epicc/content-contracts';
import { imageSourceSet, staticImageSources } from './image-sources';

export const artworkPath = '/images/vitrine/';

type ArtworkProps = {
  file: string;
  src?: string | null;
  className?: string;
  alt?: string;
  width: number;
  height: number;
  eager?: boolean;
  sources?: ResponsiveImageSource[] | undefined;
  sizes?: string;
};

/** Les dessins restent des images ; les textes courants sont du HTML. */
export function Artwork({
  file,
  src,
  className,
  alt = '',
  width,
  height,
  eager = false,
  sources,
  sizes = `(max-width: 700px) 85vw, (max-width: 1920px) ${width / 19.2}vw, ${width}px`,
}: ArtworkProps) {
  return (
    <img
      src={src ?? `${artworkPath}${file}`}
      srcSet={imageSourceSet(
        sources ?? (!src ? staticImageSources(file) : undefined),
      )}
      sizes={sizes}
      decoding="async"
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
    />
  );
}
