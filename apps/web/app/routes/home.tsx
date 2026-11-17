import { Opening } from '../components/vitrine/opening';
import { Services } from '../components/vitrine/services';
import { Biography } from '../components/vitrine/biography';
import { Manifesto } from '../components/vitrine/manifesto';
import { Projects } from '../components/vitrine/projects';
import { Contact } from '../components/vitrine/contact';

export default function Home({
  email,
  basePath,
}: {
  email: string | null;
  basePath: string;
}) {
  return (
    <main id="contenu" className="vitrine">
      <h1 className="vitrine-sr-only">
        EPICC — Chloé Catala, communication et identité visuelle à Toulouse
      </h1>
      <Opening />
      <Services />
      <Biography />
      <Manifesto />
      <Projects basePath={basePath} />
      <Contact email={email} />
    </main>
  );
}
