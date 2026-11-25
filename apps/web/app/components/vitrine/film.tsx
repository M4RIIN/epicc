import { Artwork } from './artwork';
import { useVitrineImage } from './media';

type FilmProps = {
  source: string | undefined;
  file: string;
  width: number;
  height: number;
  alt: string;
  eager?: boolean;
  floating?: boolean;
};

export function VitrineFilm({
  source,
  file,
  width,
  height,
  alt,
  eager = false,
  floating,
}: FilmProps) {
  const { image } = useVitrineImage(file, width);
  if (!source) {
    return (
      <Artwork
        file={file}
        width={width}
        height={height}
        alt={alt}
        eager={eager}
        sizes={
          eager
            ? '95vw'
            : '(max-width: 900px) 86vw, (max-width: 1920px) 64vw, 1219px'
        }
      />
    );
  }

  return (
    <div
      className="vitrine-film"
      data-floating-film={floating || undefined}
      style={{ aspectRatio: width / height }}
    >
      <video
        src={source}
        poster={image}
        width={width}
        height={height}
        aria-label={alt}
        muted
        playsInline
        loop
        controls
        preload="none"
      />
      {floating && (
        <button
          className="vitrine-film-close"
          type="button"
          aria-label="Fermer la vidéo"
        >
          ×
        </button>
      )}
    </div>
  );
}
