import type { ResponsiveImageSource } from './media';

export function imageSourceSet(sources: ResponsiveImageSource[] | undefined) {
  return sources?.map(({ src, width }) => `${src} ${width}w`).join(', ');
}
