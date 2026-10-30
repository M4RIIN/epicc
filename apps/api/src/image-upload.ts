import sharp from 'sharp';
import type { UploadedImage } from './clients.store';

export async function readImage(file: FormDataEntryValue | null) {
  let image: UploadedImage | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024)
      throw new Error('L’image doit peser au maximum 5 Mo.');
    const content = new Uint8Array(await file.arrayBuffer());
    const hex = Buffer.from(content.subarray(0, 12)).toString('hex');
    const valid =
      (file.type === 'image/jpeg' && hex.startsWith('ffd8ff')) ||
      (file.type === 'image/png' && hex.startsWith('89504e470d0a1a0a')) ||
      (file.type === 'image/webp' &&
        hex.startsWith('52494646') &&
        hex.slice(16) === '57454250');
    if (!valid)
      throw new Error('Choisissez une image JPEG, PNG ou WebP valide.');
    try {
      const optimized = await sharp(content, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({
          width: 1920,
          height: 1920,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
      image = { mime: 'image/webp', content: optimized };
    } catch {
      throw new Error(
        'Image illisible ou trop grande. Choisissez une image JPEG, PNG ou WebP valide (40 millions de pixels maximum).',
      );
    }
  }
  return image;
}
