import { expect, it } from 'vitest';
import sharp from 'sharp';
import { readImage } from './image-upload';

it('conserve les octets, le format et la résolution de la photographie téléversée', async () => {
  const original = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: '#a7bba8' },
  })
    .jpeg()
    .toBuffer();
  const image = await readImage(
    new File([original], 'photo.jpg', { type: 'image/jpeg' }),
  );
  expect(image?.mime).toBe('image/jpeg');
  expect(Buffer.from(image!.content)).toEqual(original);
  const metadata = await sharp(image!.content).metadata();
  expect(metadata.width).toBe(3000);
  expect(metadata.height).toBe(2000);
});
it('refuse un fichier corrompu même si sa signature ressemble à une image', async () => {
  const corrupt = Buffer.from('89504e470d0a1a0a00000000', 'hex');
  await expect(
    readImage(new File([corrupt], 'corrompu.png', { type: 'image/png' })),
  ).rejects.toThrow('Image illisible');
});
