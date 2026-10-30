import { optimizedImages } from './images.generated';

export const artworkPath = '/images/vitrine/';

type ArtworkProps = {
  file: string;
  className?: string;
  alt?: string;
  width: number;
  height: number;
  eager?: boolean;
  sizes?: string;
};

/** Les dessins restent des images ; les textes courants sont du HTML. */
export function Artwork({
  file,
  className,
  alt = '',
  width,
  height,
  eager = false,
  sizes = '100vw',
}: ArtworkProps) {
  const optimized = optimizedImages[file as keyof typeof optimizedImages];
  return (
    <img
      src={optimized?.src ?? `${artworkPath}${file}`}
      srcSet={optimized?.srcSet}
      sizes={optimized ? sizes : undefined}
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
