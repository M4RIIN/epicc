import manifest from './image-manifest.generated.json';
import type { ResponsiveImageSource } from '@epicc/content-contracts';

const staticImages = manifest as Record<
  string,
  { candidates: ResponsiveImageSource[] }
>;

export function staticImageSources(file: string) {
  return staticImages[file]?.candidates;
}
export function imageSourceSet(sources: ResponsiveImageSource[] | undefined) {
  return sources?.map(({ src, width }) => `${src} ${width}w`).join(', ');
}
