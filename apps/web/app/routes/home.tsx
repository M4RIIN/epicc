import type { Route } from './+types/home';
import { loadHomePage } from '../services/content.server';
import { getSiteOrigin } from '../services/site.server';

export async function loader() {
  return { page: await loadHomePage(), origin: getSiteOrigin() };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data)
    return [
      { title: 'EPICC — Contenu indisponible' },
      { name: 'robots', content: 'noindex' },
    ];
  return [
    { title: `${data.page.title} | EPICC` },
    { name: 'description', content: data.page.description },
    { property: 'og:title', content: data.page.title },
    { property: 'og:description', content: data.page.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:url', content: `${data.origin}/` },
    { tagName: 'link', rel: 'canonical', href: `${data.origin}/` },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { page } = loaderData;
  return (
    <main id="contenu">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> Des convictions. Du mouvement.
          </p>
          <h1 id="hero-title">{page.title}</h1>
          <p className="hero-description">{page.description}</p>
          <a className="button" href="#approche">
            Découvrir notre approche <span aria-hidden="true">↗</span>
          </a>
          <p className="hero-footnote">Voir plus loin. Construire ensemble.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-caption">L’AMBITION PREND FORME</span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="art-core">
            e<span>✳</span>
          </div>
          <span className="art-coordinate">UNE IDÉE → UN NOUVEL HORIZON</span>
          <span className="art-number">01 / ∞</span>
        </div>
      </section>
      <section
        className="approach"
        id="approche"
        aria-labelledby="approach-title"
      >
        <p className="eyebrow">01 — Notre approche</p>
        <div>
          <h2 id="approach-title">
            Les belles histoires commencent par une conviction.
          </h2>
          <p>{page.body}</p>
        </div>
      </section>
      <section className="principles" aria-label="Nos engagements">
        {[
          [
            '01',
            'Écouter d’abord.',
            'Comprendre votre contexte et ce qui compte vraiment pour vous.',
          ],
          [
            '02',
            'Faire avec sens.',
            'Transformer une intention claire en une expérience cohérente.',
          ],
          [
            '03',
            'Penser la suite.',
            'Poser des bases solides pour accompagner vos ambitions.',
          ],
        ].map(([number, title, description]) => (
          <article key={number}>
            <span className="principle-number">{number}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
