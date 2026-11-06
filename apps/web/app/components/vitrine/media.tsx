import { createContext, useContext, type ReactNode } from 'react';
import type { VitrineImage } from '@epicc/content-contracts';

const MediaContext = createContext<VitrineImage[]>([]);
export function VitrineMedia({
  images,
  children,
}: {
  images: VitrineImage[];
  children: ReactNode;
}) {
  return (
    <MediaContext.Provider value={images}>{children}</MediaContext.Provider>
  );
}
export function useVitrineImage(file: string) {
  return useContext(MediaContext).find((image) => image.file === file);
}
export function useVitrineImageUrl(file: string) {
  const image = useVitrineImage(file);
  if (!image) throw new Error(`Référence de visuel absente : ${file}`);
  return image.image;
}
