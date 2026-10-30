import { Link } from 'react-router';
import type { Route } from './+types/client';
import { loadClients } from '../services/clients.server';
import { getSiteOrigin } from '../services/site.server';

export async function loader({ params }: Route.LoaderArgs) {
  const clients = await loadClients();
  const index = clients.findIndex((client) => client.slug === params.slug);
  const client = clients[index];
  if (!client) throw new Response('Fiche introuvable', { status: 404 });
  return {
    client,
    total: clients.length,
    previous: clients[index - 1] ?? null,
    next: clients[index + 1] ?? null,
    origin: getSiteOrigin(),
  };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data)
    return [
      { title: 'Fiche introuvable | EPICC' },
      { name: 'robots', content: 'noindex' },
    ];
  const title = `${data.client.name} — Une rencontre EPICC`;
  return [
    { title },
    { name: 'description', content: data.client.description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: data.client.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: `${data.origin}${data.client.image}` },
    { property: 'og:image:alt', content: data.client.alt },
    { property: 'og:locale', content: 'fr_FR' },
    {
      property: 'og:url',
      content: `${data.origin}/clients/${data.client.slug}`,
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${data.origin}/clients/${data.client.slug}`,
    },
  ];
}

export default function Client({ loaderData }: Route.ComponentProps) {
  const { client, previous, next, total } = loaderData;
  return (
    <main id="contenu" className="client-page">
      <nav className="file-breadcrumb" aria-label="Fil d’Ariane">
        <Link to="/clients#clients">← Retour au répertoire</Link>
        <span>Les rencontres / Fiche n° {client.number}</span>
      </nav>
      <article className="client-file paper" aria-labelledby="client-title">
        <div className="file-masthead">
          <Link className="brand" to="/">
            EPICC<span aria-hidden="true">✳</span>
          </Link>
          <div>
            ARCHIVES DES BELLES RENCONTRES
            <br />
            DOCUMENT À CONSERVER PRÉCIEUSEMENT
          </div>
          <span className="file-number">N° {client.number}</span>
        </div>
        <div className="file-title">
          <div>
            <p className="eyebrow">Formulaire de rencontre / {client.year}</p>
            <h1 id="client-title">{client.name}</h1>
          </div>
          <span className="file-stamp">
            BELLE
            <br />
            RENCONTRE
            <br />
            <b>✳ EPICC ✳</b>
          </span>
        </div>
        <p className="file-instruction">
          Quelques mots pour faire connaissance. À remplir avec votre
          personnalité.
        </p>
        <div className="file-layout">
          <div className="file-answers">
            <dl>
              <div className="form-line">
                <dt>01 / Votre nom</dt>
                <dd>{client.name}</dd>
              </div>
              <div className="form-split">
                <div className="form-line">
                  <dt>02 / Votre point d’ancrage</dt>
                  <dd>{client.place}</dd>
                </div>
                <div className="form-line">
                  <dt>03 / Première rencontre</dt>
                  <dd>{client.year}</dd>
                </div>
              </div>
              <div className="form-line">
                <dt>04 / Votre univers</dt>
                <dd>{client.sector}</dd>
              </div>
              <div className="form-line">
                <dt>05 / Présentez-vous en quelques mots</dt>
                <dd>{client.description}</dd>
              </div>
              <div className="form-line">
                <dt>06 / L’envie qui vous a amenés chez nous</dt>
                <dd>{client.need}</dd>
              </div>
            </dl>
          </div>
          <aside className="file-memories" aria-label="Le carnet visuel">
            <figure className="file-photo taped">
              <img
                src={client.image}
                alt={client.alt}
                width="1000"
                height="1100"
              />
              <figcaption className="handwritten">{client.tagline}</figcaption>
            </figure>
            <div className={`memory-note paper taped ${client.color}`}>
              <p className="eyebrow">Dans la marge…</p>
              <p className="handwritten">{client.note}</p>
              <span aria-hidden="true">♡</span>
            </div>
          </aside>
        </div>
        <div className="file-delivery">
          <span className="eyebrow">
            07 / Ce que nous avons imaginé ensemble
          </span>
          <p>
            {client.work.split(' · ').map((item) => (
              <span key={item}>
                <span aria-hidden="true">✓</span> {item}
              </span>
            ))}
          </p>
        </div>
        <div className="file-signature">
          <div>
            <span className="eyebrow">Signature du client</span>
            <p className="handwritten">{client.signature}</p>
          </div>
          <p className="handwritten">La suite reste à écrire…</p>
        </div>
        <div className="file-bottom">
          <span>EPICC / RÉPERTOIRE DES RENCONTRES</span>
          <span>
            EXEMPLAIRE DE DÉMONSTRATION — {client.number} /{' '}
            {String(total).padStart(2, '0')}
          </span>
        </div>
      </article>
      <p className="demo-notice">
        Fiche de démonstration · Client, projet et propos fictifs. Photographie
        d’illustration.
      </p>
      <nav
        className="file-pagination"
        aria-label="Parcourir les fiches clients"
      >
        {previous ? (
          <Link to={`/clients/${previous.slug}`}>← {previous.name}</Link>
        ) : (
          <span />
        )}
        <Link to="/clients#clients">Toutes les rencontres</Link>
        {next ? (
          <Link to={`/clients/${next.slug}`}>{next.name} →</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
