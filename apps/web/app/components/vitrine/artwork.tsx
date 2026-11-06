import type { ResponsiveImageSource } from '@epicc/content-contracts';
import { imageSourceSet } from './image-sources';
import { useVitrineImage } from './media';

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
  const media = useVitrineImage(file);
  const image = src ?? media?.image;
  if (!image) throw new Error(`Référence de visuel absente : ${file}`);
  return (
    <img
      src={image}
      srcSet={imageSourceSet(sources ?? media?.sources)}
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
