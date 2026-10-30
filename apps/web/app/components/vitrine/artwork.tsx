export const artworkPath = '/images/vitrine/';

type ArtworkProps = {
  file: string;
  className?: string;
  alt?: string;
  width: number;
  height: number;
  eager?: boolean;
};

/** Les dessins restent des images ; les textes courants sont du HTML. */
export function Artwork({
  file,
  className,
  alt = '',
  width,
  height,
  eager = false,
}: ArtworkProps) {
  return (
    <img
      src={`${artworkPath}${file}`}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
    />
  );
}
