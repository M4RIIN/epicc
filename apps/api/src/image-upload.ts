import sharp from 'sharp';
import { imageUploadLimit } from '@epicc/content-contracts';
import type { UploadedImage } from './images.store';

export function uploadBodyLimit() {
  return imageUploadLimit(process.env.IMAGE_MAX_BYTES) + 1024 * 1024;
}
export async function readImage(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return undefined;
  const limit = imageUploadLimit(process.env.IMAGE_MAX_BYTES);
  if (file.size > limit)
    throw new Error(`L’image doit peser au maximum ${limit / 1024 / 1024} Mo.`);
  const content = new Uint8Array(await file.arrayBuffer());
  try {
    const decoder = sharp(content, {
      limitInputPixels: 40_000_000,
      failOn: 'warning',
    });
    const metadata = await decoder.metadata();
    const mime = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heif: 'image/avif',
    }[metadata.format as string];
    // libvips distingue HEIC d’AVIF par le codec HEIF.
    if (
      !mime ||
      (metadata.format === 'heif' && metadata.compression !== 'av1') ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error('Format refusé.');
    await decoder.stats(); // Décodage réel, au-delà de l’en-tête et du MIME déclaré.
    return {
      mime,
      content,
      width: metadata.width,
      height: metadata.height,
    } satisfies UploadedImage;
  } catch {
    throw new Error(
      'Image illisible ou trop grande. Choisissez une image JPEG, PNG, WebP ou AVIF fixe valide (40 millions de pixels maximum).',
    );
  }
}
