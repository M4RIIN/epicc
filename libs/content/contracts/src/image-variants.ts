// Recette versionnée : une URL de variante ne change jamais de contenu.
export const imageVariantVersion = '1';
export const imageVariantWidths = [320, 640, 1280, 1920] as const;
export type ImageVariantWidth = (typeof imageVariantWidths)[number];

export function imageVariantUrl(source: string, width: ImageVariantWidth) {
  return `${source}?w=${width}&v=${imageVariantVersion}`;
}

export type ResponsiveImageSource = { src: string; width: number };
export function imageVariantSources(
  source: string,
  naturalWidth: number,
): ResponsiveImageSource[] {
  const seen = new Set<number>();
  return imageVariantWidths.flatMap((width) => {
    const actual = Math.min(width, naturalWidth);
    if (seen.has(actual)) return [];
    seen.add(actual);
    return [{ src: imageVariantUrl(source, width), width: actual }];
  });
}
