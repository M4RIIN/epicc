import {
  vitrineAssetFiles,
  vitrineImageSchema,
} from '@epicc/content-contracts';
import { clientsRequest } from './clients.server';

export async function loadVitrineImages() {
  const response = await clientsRequest('vitrine-images');
  if (!response.ok)
    throw new Response('Les visuels sont temporairement indisponibles.', {
      status: 503,
    });
  const parsed = vitrineImageSchema.array().safeParse(await response.json());
  if (!parsed.success)
    throw new Response('Les visuels sont temporairement indisponibles.', {
      status: 503,
    });
  const images = parsed.data;
  if (
    vitrineAssetFiles.some(
      (file) => !images.some((image) => image.file === file),
    )
  )
    throw new Response('Les visuels sont temporairement indisponibles.', {
      status: 503,
    });
  return images;
}
