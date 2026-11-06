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
  const [offers, projectImages] = await Promise.all([
    loadOffers(),
    loadProjectImages(),
  ]);
  return {
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
    { tagName: 'link', rel: 'canonical', href: `${loaderData.origin}/` },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
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
    </>
  );
}
