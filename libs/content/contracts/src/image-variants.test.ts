import { expect, it } from 'vitest';
import { imageVariantSources } from './image-variants';

it('annonce les vraies largeurs et évite les doublons pour une petite image', () => {
  const url = '/api/v1/offer-images/00000000-0000-0000-0000-000000000066';
  expect(imageVariantSources(url, 500)).toEqual([
    { src: `${url}?w=320&v=1`, width: 320 },
    { src: `${url}?w=640&v=1`, width: 500 },
  ]);
  expect(imageVariantSources(url, 2)).toEqual([
    { src: `${url}?w=320&v=1`, width: 2 },
  ]);
});
