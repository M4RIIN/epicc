import { expect, it } from 'vitest';
import { vitrineProjects } from './vitrine-projects';

it('rattache les séries de photos aux projets et aux colonnes des références', () => {
  const photos = (name: string) =>
    vitrineProjects
      .find((project) => project.name === name)!
      .pieces.filter((piece) => piece.role === 'photo')
      .map((piece) => piece.file);
  expect(photos('Viande des Sorgues')).toEqual([
    'Rectangle5.png',
    'Rectangle4.png',
    'Dsc19081.jpg',
    'Dsc067761.jpg',
  ]);
  expect(photos('Annafurna')).toEqual(['D8DV39.png', 'Rectangle6.png']);
  expect(photos('Club des riches')).toEqual(['Rectangle8.jpg']);
  expect(photos('Casamatta')).toEqual(['Dsc10951.jpg', 'Gkmkqt.png']);
  expect(photos('Origin')).toEqual(['Rectangle7.png', 'Dsc18591.jpg']);
  expect(photos('Les Trois Sœurs')).toEqual(['Dsc09451.jpg']);
  expect(
    vitrineProjects.find((project) => project.name === 'Viande des Sorgues')!
      .side,
  ).toBe('left');
  expect(
    vitrineProjects.find((project) => project.name === 'Annafurna')!.side,
  ).toBe('right');
});

it('conserve les identifiants des 26 visuels et distingue les deux titres du projet associé', () => {
  const files = vitrineProjects.flatMap((project) =>
    project.pieces.map((piece) => piece.file),
  );
  expect(files).toHaveLength(26);
  expect(new Set(files).size).toBe(26);
  expect(
    vitrineProjects
      .find((project) => project.name === 'L’Écluse Douze — Deux Mnu')!
      .pieces.every((piece) => piece.role === 'name'),
  ).toBe(true);
});
