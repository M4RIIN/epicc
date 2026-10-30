import type { Route } from './+types/home';
import { getSiteOrigin } from '../services/site.server';
import { Opening } from '../components/vitrine/opening';
import { Services } from '../components/vitrine/services';
import { Biography } from '../components/vitrine/biography';
import { Manifesto } from '../components/vitrine/manifesto';
import { Offers } from '../components/vitrine/offers';
import '../components/vitrine/vitrine.css';

export function loader() {
  return { origin: getSiteOrigin() };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const title = 'EPICC — Communication, restauration & agroalimentaire';
  const description =
    'Chloé Gathla accompagne les acteurs de la restauration et de l’agroalimentaire : identité de marque, stratégie, réseaux sociaux et événementiel.';
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:url', content: `${loaderData?.origin}/` },
    { tagName: 'link', rel: 'canonical', href: `${loaderData?.origin}/` },
  ];
}

export default function Home() {
  return (
    <main id="contenu" className="vitrine">
      <h1 className="vitrine-sr-only">
        EPICC — Communication pour la restauration et l’agroalimentaire
      </h1>
      <Opening />
      <Services />
      <Biography />
      <Manifesto />
      <Offers />
    </main>
  );
}
