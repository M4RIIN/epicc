import { Form, Link } from 'react-router';
import type { Route } from './+types/home';
import { loadHomePage } from '../services/content.server';
import { getSiteOrigin } from '../services/site.server';
import { clients, sectors } from '../services/clients';

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') ?? '').trim();
  const sector = params.get('secteur') ?? '';
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr');
  const results = clients.filter(
    (client) =>
      (!sector || client.sector === sector) &&
      normalize(`${client.name} ${client.place} ${client.sector}`).includes(
        normalize(query),
      ),
  );
  return {
    page: await loadHomePage(),
    origin: getSiteOrigin(),
    clients: results,
    query,
    sector,
  };
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
  const { page, clients: results, query, sector } = loaderData;
  return (
    <main id="contenu">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> Studio indépendant · Idées
            collectives
          </p>
          <h1 id="hero-title">
            Les belles histoires
            <br />
            s’écrivent <em>à plusieurs.</em>
          </h1>
          <p className="hero-description">
            On fait de vos idées des identités singulières.
            <br />
            Des rencontres, du sens et ce petit supplément d’âme.
          </p>
          <a className="button" href="#clients">
            Rencontrer nos clients <span aria-hidden="true">↗</span>
          </a>
          <span className="handwritten hero-note">
            Tout commence par une rencontre.
          </span>
        </div>
        <div
          className="hero-collage"
          aria-label="Carnet créatif : photographie végétale et note de studio"
        >
          <div className="archive-paper paper">
            <span className="eyebrow">EPICC — Carnet de rencontres</span>
            <span className="archive-word">
              Les idées
              <br />
              prennent
              <br />
              <i>racine.</i>
            </span>
            <span className="archive-bottom">
              IDENTITÉS SINGULIÈRES DEPUIS LE PREMIER JOUR.
            </span>
          </div>
          <figure className="hero-photo paper taped">
            <img
              src="/images/botanique.jpg"
              alt="Jeu de lumière sur des feuilles vertes"
              width="1000"
              height="1250"
            />
            <figcaption>
              <span>Fig. 01 — Cultiver sa singularité</span>
              <span>↗</span>
            </figcaption>
          </figure>
          <div className="yellow-note paper taped">
            <span className="eyebrow">Note à nous-mêmes</span>
            <p className="handwritten">
              Les meilleurs projets
              <br />
              sont d’abord de
              <br />
              belles rencontres.
            </p>
            <span className="note-star" aria-hidden="true">
              ✳
            </span>
          </div>
          <span className="collage-caption">
            Quelques idées, beaucoup d’humain.
          </span>
        </div>
      </section>
      <div className="chapter-strip">
        <span>STRATÉGIE DE MARQUE</span>
        <span aria-hidden="true">✳</span>
        <span>IDENTITÉ VISUELLE</span>
        <span aria-hidden="true">✳</span>
        <span>EXPÉRIENCES DIGITALES</span>
        <span aria-hidden="true">✳</span>
        <span>ET SURTOUT, DES RENCONTRES</span>
      </div>
      <section
        className="clients-section"
        id="clients"
        aria-labelledby="clients-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / Les gens derrière les projets</p>
            <h2 id="clients-title">
              Bien entourés.
              <span className="handwritten">Et fiers de l’être.</span>
            </h2>
          </div>
          <p>
            Des univers différents. Une même envie de bien faire.
            <br />
            Ouvrez une fiche, une histoire vous attend.
          </p>
        </div>
        <div className="directory paper">
          <div className="directory-top">
            <span>LE RÉPERTOIRE EPICC</span>
            <span>
              {String(clients.length).padStart(2, '0')} RENCONTRES À FEUILLETER
            </span>
          </div>
          <Form
            method="get"
            action="/#clients"
            className="client-filters"
            role="search"
            aria-label="Rechercher un client"
          >
            <div className="search-field">
              <label htmlFor="client-search">Nom, ville ou univers</label>
              <input
                id="client-search"
                name="q"
                type="search"
                placeholder="À la recherche de quelqu’un ?"
                defaultValue={query}
                key={query}
              />
            </div>
            <div className="sector-field">
              <label htmlFor="client-sector">Univers</label>
              <select
                id="client-sector"
                name="secteur"
                defaultValue={sector}
                key={sector}
              >
                <option value="">Tous les univers</option>
                {sectors.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="filter-button">
              Rechercher <span aria-hidden="true">↗</span>
            </button>
          </Form>
          <div className="results-line">
            <p role="status">
              {results.length}{' '}
              {results.length > 1 ? 'fiches à découvrir' : 'fiche à découvrir'}
            </p>
            <span>↓ Choisissez une rencontre</span>
            {(query || sector) && <Link to="/#clients">Tout afficher ×</Link>}
          </div>
        </div>
        <div className="client-grid">
          {results.map((client) => (
            <Link
              className={`client-card paper ${client.color}`}
              to={`/clients/${client.slug}`}
              key={client.slug}
              aria-label={`Découvrir ${client.name}`}
            >
              <div className="client-card-top">
                <span>N° {client.number}</span>
                <span>{client.sector}</span>
                <span aria-hidden="true">↗</span>
              </div>
              <figure className="client-photo taped">
                <img
                  src={`/images/${client.image}.jpg`}
                  alt={client.alt}
                  width="1000"
                  height="700"
                  loading="lazy"
                />
                <figcaption className="handwritten">
                  {client.tagline}
                </figcaption>
              </figure>
              <div className="client-card-bottom">
                <h3>{client.name}</h3>
                <p>
                  {client.place}
                  <span>Fiche client / {client.year}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
        {results.length === 0 && (
          <div className="empty-state paper">
            <h3>Aucune fiche pour le moment.</h3>
            <p>Essayez un autre nom, une autre ville ou un autre univers.</p>
            <Link className="text-link" to="/#clients">
              Retrouver toutes les rencontres ↗
            </Link>
          </div>
        )}
        <p className="demo-notice">
          Répertoire de démonstration · Noms, projets et propos fictifs,
          photographies d’illustration.
        </p>
      </section>
      <section
        className="approach"
        id="approche"
        aria-labelledby="approach-title"
      >
        <div>
          <p className="eyebrow">02 / La manière EPICC</p>
          <span className="approach-star" aria-hidden="true">
            ✳
          </span>
        </div>
        <div>
          <h2 id="approach-title">
            Du fond. De la forme.
            <br />
            <em>Et du lien.</em>
          </h2>
          <p>{page.body}</p>
          <div className="principles">
            {[
              [
                '01',
                'Se rencontrer.',
                'Écouter votre histoire, comprendre ce qui vous anime.',
              ],
              [
                '02',
                'Imaginer ensemble.',
                'Trouver les mots, les formes et les idées qui vous ressemblent.',
              ],
              [
                '03',
                'Faire durer.',
                'Créer des bases solides pour les chapitres à venir.',
              ],
            ].map(([number, title, description]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="closing-note paper taped">
        <p className="eyebrow">La suite s’écrit ensemble</p>
        <h2>
          Et si la prochaine histoire,
          <br />
          c’était <em>la vôtre ?</em>
        </h2>
        <a className="text-link" href="#clients">
          Feuilleter nos rencontres <span aria-hidden="true">↗</span>
        </a>
        <span className="handwritten">À très vite, EPICC.</span>
      </section>
    </main>
  );
}
