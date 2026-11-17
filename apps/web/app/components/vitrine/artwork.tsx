import { imageSourceSet } from './image-sources';
import { useVitrineImage } from './media';

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
  sizes = `(max-width: 700px) 85vw, (max-width: 1920px) ${width / 19.2}vw, ${width}px`,
}: ArtworkProps) {
  const media = useVitrineImage(file, width);
  const image = media.image;
  return (
    <img
      src={image}
      srcSet={imageSourceSet(media.sources)}
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
