import type { offers } from './offers';

type TooltipArtwork = readonly [name: string, width: number, height: number];

type TooltipDesign = {
  title: readonly TooltipArtwork[];
  description: string;
};

export const serviceTooltips: Record<
  (typeof offers)[number]['slug'],
  TooltipDesign
> = {
  'creation-de-marque': {
    title: [
      ['lancement-titre', 491, 275],
      ['lancement-marque', 482, 276],
    ],
    description:
      'Logos et iconographie | charte graphique | stratégie et positionnement commercial | plateforme de marque | ateliers collectifs ou individuels.',
  },
  'restructuration-de-restaurants': {
    title: [['restructuration-titre', 1384, 373]],
    description:
      'Faire évoluer une marque existante. Audit | benchmark | positionnement | stratégie et ateliers collectifs ou individuels.',
  },
  'reseaux-sociaux': {
    title: [['reseaux-titre', 839, 260]],
    description:
      'Community management. Maquettes pour le site et les réseaux sociaux | stratégie d’animation | community management | Google Ads et référencement.',
  },
  'video-photographe': {
    title: [['contenus-titre', 1409, 262]],
    description:
      'Photo et vidéo. Shooting photo et reportages vidéo | réels | aftermovies | interviews et podcasts.',
  },
  graphisme: {
    title: [['graphisme-titre', 637, 271]],
    description:
      'Digital et print. Affiches | menus | flyers | cartes de visite et supports imprimés.',
  },
  evenementiel: {
    title: [
      ['evenementiel-titre', 771, 377],
      ['evenementiel-croix', 86, 197],
      ['evenementiel-scenographie', 594, 377],
    ],
    description:
      'Conception et coordination. Scénographie de tables | décoration et aménagement | organisation d’événements | team building et animation d’ateliers | recherche et pilotage de prestataires.',
  },
};
