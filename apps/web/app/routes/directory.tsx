import { Form, Link } from 'react-router';
import type { Route } from './+types/directory';
import { loadHomePage } from '../services/content.server';
import { getSiteOrigin } from '../services/site.server';
import { loadClients } from '../services/clients.server';

export async function loader({ request }: Route.LoaderArgs) {
  const clients = await loadClients();
  const sectors = [...new Set(clients.map((client) => client.sector))];
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
    total: clients.length,
    sectors,
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
    { title: 'Les rencontres | EPICC' },
    { name: 'description', content: data.page.description },
    { property: 'og:title', content: data.page.title },
    { property: 'og:description', content: data.page.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:url', content: `${data.origin}/clients` },
    { tagName: 'link', rel: 'canonical', href: `${data.origin}/clients` },
  ];
}

export default function Directory({ loaderData }: Route.ComponentProps) {
  const { clients: results, query, sector, total, sectors } = loaderData;
  return (
    <main id="contenu">
      <section
        className="clients-section"
        id="clients"
        aria-labelledby="clients-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / Les gens derrière les projets</p>
            <h1 id="clients-title">
              Bien entourés.
              <span className="handwritten">Et fiers de l’être.</span>
            </h1>
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
              {String(total).padStart(2, '0')} RENCONTRES À FEUILLETER
            </span>
          </div>
          <Form
            method="get"
            action="/clients#clients"
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
            {(query || sector) && (
              <Link to="/clients#clients">Tout afficher ×</Link>
            )}
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
                  src={client.image}
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
            <Link className="text-link" to="/clients#clients">
              Retrouver toutes les rencontres ↗
            </Link>
          </div>
        )}
        <p className="demo-notice">
          Répertoire de démonstration · Noms, projets et propos fictifs,
          photographies d’illustration.
        </p>
      </section>
    </main>
  );
}
