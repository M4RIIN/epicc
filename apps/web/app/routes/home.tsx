import { VitrineMedia } from '../components/vitrine/media';
import { loadVitrineImages } from '../services/vitrine-images.server';
import type { Route } from './+types/home';
import { loadProjectImages } from '../services/projects.server';
import { loadOffers } from '../services/offers.server';
import { getContactEmail, getSiteOrigin } from '../services/site.server';
import {
  homeDescription,
  homeTitle,
  homeStructuredData,
} from '../services/seo';
import { Opening } from '../components/vitrine/opening';
import { Services } from '../components/vitrine/services';
import { Biography } from '../components/vitrine/biography';
import { Manifesto } from '../components/vitrine/manifesto';
import { Projects } from '../components/vitrine/projects';
import { Contact } from '../components/vitrine/contact';
import '../components/vitrine/vitrine.css';

export async function loader() {
  const [offers, projectImages, fixedImages] = await Promise.all([
    loadOffers(),
    loadProjectImages(),
    loadVitrineImages(),
  ]);
  if (projectImages.some((image) => !image.image))
    throw new Response('Les visuels sont temporairement indisponibles.', {
      status: 503,
    });
  const images = [
    ...fixedImages,
    ...projectImages.map((image) => ({
      file: `projets-${image.file}`,
      image: image.image!,
      ...(image.sources ? { sources: image.sources } : {}),
    })),
  ];
  return {
    images,
    cover: fixedImages.find((image) => image.file === 'AccueilChloe.png')!
      .image,
    origin: getSiteOrigin(),
    offers,
    projectImages,
    contactEmail: getContactEmail(),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) {
    return [
      { title: 'EPICC — Contenu indisponible' },
      { name: 'robots', content: 'noindex' },
    ];
  }
  const title = homeTitle;
  const description = homeDescription;
  return [
    { title },
    {
      'script:ld+json': homeStructuredData(
        loaderData.origin,
        loaderData.offers,
      ),
    },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'EPICC' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:url', content: `${loaderData.origin}/` },
    {
      property: 'og:image',
      content: `${loaderData.origin}${loaderData.cover}`,
    },
    { property: 'og:image:width', content: '1536' },
    { property: 'og:image:height', content: '1024' },
    { property: 'og:image:alt', content: 'Chloé Catala, fondatrice d’EPICC' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    {
      name: 'twitter:image',
      content: `${loaderData.origin}${loaderData.cover}`,
    },
    { tagName: 'link', rel: 'canonical', href: `${loaderData.origin}/` },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <VitrineMedia images={loaderData.images}>
      <main id="contenu" className="vitrine">
        <h1 className="vitrine-sr-only">
          EPICC — Chloé Catala, communication et identité visuelle à Toulouse
        </h1>
        <Opening />
        <Services offers={loaderData.offers} />
        <Biography />
        <Manifesto />
        <Projects images={loaderData.projectImages} />
        <Contact email={loaderData.contactEmail} />
      </main>
    </VitrineMedia>
  );
}
