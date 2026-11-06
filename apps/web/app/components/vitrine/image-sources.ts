import type { ResponsiveImageSource } from '@epicc/content-contracts';

export function imageSourceSet(sources: ResponsiveImageSource[] | undefined) {
  return sources?.map(({ src, width }) => `${src} ${width}w`).join(', ');
}
