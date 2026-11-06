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
import {
  projectClients,
  clientPieces,
  projectSides,
} from '@epicc/content-contracts';
import { loadProjectImages } from '../services/projects.server';
import { loadOffers } from '../services/offers.server';

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
  const { authenticated, configured, csrf, offers, projectImages } = loaderData;
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
            Connectez-vous pour gérer les images des projets clients et des
            offres.
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
              Les mêmes colonnes et les mêmes séries de photos que sur la
              vitrine. Chaque titre est aligné avec la première photo de son
              projet ; les photos suivantes sont affichées dans leur ordre
              vertical.
            </p>
            <div className="admin-project-columns">
              {projectSides.map((side) => (
                <section
                  className="admin-project-column"
                  key={side}
                  aria-labelledby={`admin-project-${side}`}
                >
                  <h3 id={`admin-project-${side}`}>
                    Colonne {side === 'left' ? 'gauche' : 'droite'}
                  </h3>
                  <div className="admin-projects">
                    {projectClients
                      .filter((project) => project.side === side)
                      .map((client) => {
                        const project = {
                          ...client,
                          pieces: clientPieces(client, projectImages),
                        };
                        return (
                          <article
                            key={project.name}
                            className="admin-project-card"
                            data-side={side}
                            aria-label={project.name}
                          >
                            <h4>{project.name}</h4>
                            <div className="admin-project-images">
                              {(['name', 'photo'] as const).map((role) => (
                                <ul
                                  key={role}
                                  className={
                                    role === 'name'
                                      ? 'admin-project-titles'
                                      : 'admin-project-photos'
                                  }
                                  aria-label={
                                    role === 'name'
                                      ? 'Titres du projet'
                                      : 'Photos du projet'
                                  }
                                >
                                  {project.pieces
                                    .filter((piece) => piece.role === role)
                                    .map((piece, index) => {
                                      const image = projectImages.find(
                                        (item) => item.file === piece.file,
                                      )!;
                                      return (
                                        <li
                                          key={piece.file}
                                          style={{
                                            width: `${Math.min(100, (piece.width / (role === 'name' ? 600 : 300)) * 100)}%`,
                                          }}
                                        >
                                          <Link
                                            to={`/connect/projets/${piece.file}`}
                                            aria-label={`Modifier ${role === 'name' ? `le logo${index ? ` ${index + 1}` : ''}` : `l’image ${index + 1}`} de ${project.name} ↗`}
                                          >
                                            <img
                                              src={image.image ?? undefined}
                                              alt=""
                                              width={piece.width}
                                              height={piece.height}
                                              style={{
                                                aspectRatio:
                                                  piece.width / piece.height,
                                                objectFit:
                                                  role === 'name'
                                                    ? 'contain'
                                                    : 'cover',
                                                transform: piece.mirror
                                                  ? 'scaleX(-1)'
                                                  : undefined,
                                              }}
                                              loading="lazy"
                                            />
                                            <span aria-hidden="true">
                                              {role === 'name'
                                                ? `Logo${index ? ` ${index + 1}` : ''}`
                                                : `Photo ${index + 1}`}{' '}
                                              ↗
                                            </span>
                                          </Link>
                                        </li>
                                      );
                                    })}
                                </ul>
                              ))}
                            </div>
                            <Link
                              className="filter-button"
                              to={`/connect/projets/nouvelle?project=${encodeURIComponent(project.name)}`}
                            >
                              Ajouter une photo
                            </Link>
                            {!project.pieces.some(
                              (piece) => piece.role === 'photo',
                            ) && (
                              <p className="admin-project-empty">
                                Titre seul · Aucune photo dans la vitrine
                                actuelle.
                              </p>
                            )}
                          </article>
                        );
                      })}
                  </div>
                </section>
              ))}
            </div>
          </section>
          <section aria-labelledby="offers-title" className="admin-panel paper">
            <h2 id="offers-title">Images des offres</h2>
            <p>
              Les visuels alternent entre grand et petit format selon la
              position de l’offre. Chaque offre dispose aussi d’une image de
              survol indépendante.
            </p>
            <ul className="admin-offers">
              {offers.map((offer, index) => (
                <li key={offer.slug}>
                  <Link to={`/connect/offres/${offer.slug}`}>
                    Modifier les images : {offer.name} ↗
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
            <Form method="post">
              <input type="hidden" name="csrf" value={csrf} />
              <button name="intent" value="logout" className="filter-button">
                Se déconnecter
              </button>
            </Form>
          </div>
        </>
      )}
    </main>
  );
}
