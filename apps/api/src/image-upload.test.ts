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

it('détecte les formats réels JPEG, PNG, WebP et AVIF indépendamment du MIME déclaré', async () => {
  for (const format of ['jpeg', 'png', 'webp', 'avif'] as const) {
    const bytes = await sharp({
      create: { width: 20, height: 10, channels: 3, background: '#abc' },
    })
      [format]()
      .toBuffer();
    const image = await readImage(
      new File([bytes], 'fichier.dat', { type: 'application/octet-stream' }),
    );
    expect(image?.mime).toBe(`image/${format}`);
    expect(image?.width).toBe(20);
    expect(image?.height).toBe(10);
  }
});
it('refuse les SVG, les faux MIME et les fichiers dépassant la limite configurable', async () => {
  await expect(
    readImage(new File(['<svg></svg>'], 'faux.png', { type: 'image/png' })),
  ).rejects.toThrow('Image illisible');
  const { vi } = await import('vitest');
  vi.stubEnv('IMAGE_MAX_BYTES', '10');
  try {
    await expect(
      readImage(new File([new Uint8Array(11)], 'grand.png')),
    ).rejects.toThrow('maximum');
  } finally {
    vi.unstubAllEnvs();
  }
});
