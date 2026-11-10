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

it('conserve les identifiants historiques et ajoute les photos de la maquette', () => {
  const files = vitrineProjects.flatMap((project) =>
    project.pieces.map((piece) => piece.file),
  );
  expect(files).toHaveLength(33);
  expect(new Set(files).size).toBe(33);
  expect(
    vitrineProjects
      .find((project) => project.name === 'L’Écluse Douze — Deux Mnu')!
      .pieces.filter((piece) => piece.role === 'name').length === 2,
  ).toBe(true);
});

it('sépare les clients, conserve un seul logo par client et préserve les dimensions existantes', async () => {
  const { projectClients, clientPieces, layoutPieces } =
    await import('./vitrine-projects');
  expect(
    projectClients.filter((client) => client.name === 'L’Écluse Douze'),
  ).toHaveLength(1);
  expect(
    projectClients.filter((client) => client.name === 'Deux Mnu'),
  ).toHaveLength(1);
  expect(
    projectClients.every(
      (client) =>
        client.pieces.filter((piece) => piece.role === 'name').length === 1,
    ),
  ).toBe(true);
  for (const project of vitrineProjects)
    expect(layoutPieces(project, [])).toEqual(project.pieces);
  const project = projectClients.find(
    (client) => client.name === 'Viande des Sorgues',
  )!;
  const resized = clientPieces(project, [
    { file: 'Rectangle5.png', image: null, alt: 'Test', size: 'large' },
  ]);
  const photo = resized.find((piece) => piece.file === 'Rectangle5.png')!;
  expect(photo.width).toBe(297);
  expect(photo.width / photo.height).toBeCloseTo(222 / 283);
});
