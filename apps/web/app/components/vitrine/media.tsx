import { createContext, useContext, type ReactNode } from 'react';

export type ResponsiveImageSource = { src: string; width: number };
export type VitrineImage = { image: string; sources?: ResponsiveImageSource[] };
type ResolveImage = (file: string, displayWidth?: number) => VitrineImage;

const MediaContext = createContext<ResolveImage>(() => {
  throw new Error('Catalogue des visuels indisponible.');
});

export function VitrineMedia({
  resolve,
  children,
}: {
  resolve: ResolveImage;
  children: ReactNode;
}) {
  return (
    <MediaContext.Provider value={resolve}>{children}</MediaContext.Provider>
  );
}

export function useVitrineImage(file: string, displayWidth?: number) {
  return useContext(MediaContext)(file, displayWidth);
}

export function useVitrineImageUrl(file: string) {
  return useVitrineImage(file).image;
}
