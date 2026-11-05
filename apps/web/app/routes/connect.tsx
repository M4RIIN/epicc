import { data, Form, Link, redirect, useNavigation } from 'react-router';
import { randomBytes } from 'node:crypto';
import type { Route } from './+types/connect';
import {
  adminConfigured,
  adminSession,
  commitAdmin,
  isAdmin,
  login,
  logoutAdmin,
  verifyCsrf,
  readAdminForm,
} from '../services/admin.server';
import { vitrineProjects } from '@epicc/content-contracts';
import { loadProjectImages } from '../services/projects.server';
import { loadOffers } from '../services/offers.server';
import { loadClients } from '../services/clients.server';

export function meta() {
  return [
    { title: 'Espace de gestion | EPICC' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}
export function headers() {
  return { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };
}
export async function loader({ request }: Route.LoaderArgs) {
  const session = await adminSession(request);
  const authenticated = isAdmin(session);
  return data(
    {
      authenticated,
      configured: adminConfigured(),
      csrf: session.get('csrf') as string,
      clients: authenticated ? await loadClients(true) : [],
      projectImages: authenticated ? await loadProjectImages() : [],
      offers: authenticated ? await loadOffers() : [],
    },
    { headers: { 'Set-Cookie': await commitAdmin(session) } },
  );
}
export async function action({ request }: Route.ActionArgs) {
  const session = await adminSession(request);
  const form = await readAdminForm(request);
  verifyCsrf(request, form, session);
  if (form.get('intent') === 'logout') {
    return redirect('/connect', {
      headers: { 'Set-Cookie': await logoutAdmin(session) },
    });
  }
  const error = await login(
    String(form.get('email')),
    String(form.get('password')),
  );
  if (error)
    return data(
      { error, email: String(form.get('email') ?? '') },
      { status: 400 },
    );
  session.set('admin', true);
  session.set('expiresAt', Date.now() + 8 * 60 * 60 * 1000);
  session.set('csrf', randomBytes(32).toString('hex'));
  return redirect('/connect', {
    headers: { 'Set-Cookie': await commitAdmin(session) },
  });
}
export default function Connect({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { authenticated, configured, csrf, clients, offers, projectImages } =
    loaderData;
  const pending = useNavigation().state !== 'idle';
  return (
    <main id="contenu" className="admin-page">
      <p className="eyebrow">Espace de gestion</p>
      <h1>{authenticated ? 'Gérer les clients' : 'Connexion à la gestion'}</h1>
      <p>
        <Link to="/">Retour à la vitrine ↗</Link>
      </p>
      {!authenticated ? (
        <div className="admin-panel paper">
          <p>
            Connectez-vous pour gérer les images des projets clients, des offres
            et les fiches du répertoire.
          </p>
          {!configured && (
            <p role="status">
              La connexion sera disponible après configuration des accès
              administrateur sur le serveur.
            </p>
          )}
          <Form method="post" className="admin-form">
            <input type="hidden" name="csrf" value={csrf} />
            <label>
              Adresse e-mail
              <input
                name="email"
                defaultValue={actionData?.email}
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Mot de passe
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {actionData?.error && <p role="alert">{actionData.error}</p>}
            <button className="button" disabled={!configured || pending}>
              Se connecter
            </button>
          </Form>
        </div>
      ) : (
        <>
          <section
            id="project-images"
            aria-labelledby="project-images-title"
            className="admin-panel paper"
          >
            <p className="eyebrow">01 / La vitrine</p>
            <h2 id="project-images-title">Les projets clients</h2>
            <p>
              Les visuels du collage de la page d’accueil. Choisissez une image
              à remplacer : la composition reste identique.
            </p>
            <div className="admin-projects">
              {vitrineProjects.map((project) => (
                <article key={project.name} className="admin-project-card">
                  <h3>{project.name}</h3>
                  <ul className="admin-project-images">
                    {project.pieces.map((piece, index) => {
                      const image = projectImages.find(
                        (item) => item.file === piece.file,
                      )!;
                      return (
                        <li key={piece.file}>
                          <Link to={`/connect/projets/${piece.file}`}>
                            <img
                              src={
                                image.image ??
                                `/images/vitrine/projets-${piece.file}`
                              }
                              alt=""
                              width={240}
                              height={160}
                              loading="lazy"
                            />
                            <span>
                              Modifier{' '}
                              {index === 0 ? 'le logo' : `l’image ${index}`} de{' '}
                              {project.name} ↗
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>
          <section aria-labelledby="offers-title" className="admin-panel paper">
            <h2 id="offers-title">Images des offres</h2>
            <p>
              Les visuels alternent entre grand et petit format selon la
              position de l’offre.
            </p>
            <ul className="admin-offers">
              {offers.map((offer, index) => (
                <li key={offer.slug}>
                  <Link to={`/connect/offres/${offer.slug}`}>
                    Modifier l’image : {offer.name} ↗
                  </Link>
                  <span>
                    {' '}
                    · {index % 2 === 0 ? 'Grand format' : 'Petit format'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <div className="admin-toolbar">
            <Link className="button" to="/connect/clients/nouveau">
              Ajouter un client ↗
            </Link>
            <Form method="post">
              <input type="hidden" name="csrf" value={csrf} />
              <button name="intent" value="logout" className="filter-button">
                Se déconnecter
              </button>
            </Form>
          </div>
          <p>
            Les fiches publiées apparaissent dans le répertoire « Les rencontres
            ». L’ordre croissant détermine leur place dans le répertoire.
          </p>
          {clients.length === 0 && (
            <p>Aucun client. Ajoutez votre première fiche.</p>
          )}
          <ol className="admin-clients">
            {clients.map((client) => (
              <li key={client.slug} className="paper admin-row">
                <div>
                  <h2>{client.name}</h2>
                  <p>
                    {client.sector} · {client.place}
                  </p>
                  <p>
                    {client.published ? 'Publié' : 'Brouillon'} · Ordre :{' '}
                    {client.position}
                  </p>
                </div>
                <div>
                  <Link
                    className="text-link"
                    to={`/connect/clients/${client.slug}`}
                  >
                    Modifier {client.name} ↗
                  </Link>
                  {client.published && (
                    <p>
                      <Link to={`/clients/${client.slug}`}>
                        Voir la fiche publique
                      </Link>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
