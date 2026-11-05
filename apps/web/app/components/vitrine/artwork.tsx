export const artworkPath = '/images/vitrine/';

type ArtworkProps = {
  file: string;
  src?: string | null;
  className?: string;
  alt?: string;
  width: number;
  height: number;
  eager?: boolean;
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
}: ArtworkProps) {
  return (
    <img
      src={src ?? `${artworkPath}${file}`}
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
