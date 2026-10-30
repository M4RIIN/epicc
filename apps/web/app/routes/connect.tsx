import {
  data,
  Form,
  Link,
  redirect,
  useNavigation,
  useFetcher,
} from 'react-router';
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
import type { Client } from '@epicc/content-contracts';
import {
  loadClients,
  saveClient,
  clientsRequest,
} from '../services/clients.server';

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
  if (form.get('intent') === 'publish' || form.get('intent') === 'move') {
    if (!isAdmin(session)) return redirect('/connect');
    const clients = await loadClients(true);
    const index = clients.findIndex(
      (client) => client.slug === form.get('slug'),
    );
    const client = clients[index];
    if (!client)
      return data(
        {
          error: 'Projet introuvable. Actualisez la page.',
          email: '',
          message: '',
        },
        { status: 404 },
      );
    if (form.get('intent') === 'publish') {
      const outgoing = new FormData();
      const published = form.get('published') === 'yes';
      outgoing.set('client', JSON.stringify({ ...client, published }));
      const error = await saveClient(client.slug, outgoing);
      return data(
        {
          error,
          email: '',
          message: error ? '' : published ? 'Projet publié.' : 'Projet masqué.',
        },
        { status: error ? 400 : 200 },
      );
    }
    const destination = index + (form.get('direction') === 'up' ? -1 : 1);
    if (destination < 0 || destination >= clients.length)
      return data({ error: null, email: '', message: 'Ordre inchangé.' });
    const slugs = clients.map((item) => item.slug);
    [slugs[index], slugs[destination]] = [slugs[destination]!, slugs[index]!];
    const outgoing = new FormData();
    outgoing.set('slugs', JSON.stringify(slugs));
    const response = await clientsRequest(
      'admin/clients-order',
      { method: 'POST', body: outgoing },
      true,
    );
    return data(
      {
        error: response.ok
          ? null
          : 'Déplacement impossible. Actualisez la page et réessayez.',
        email: '',
        message: response.ok ? 'Ordre enregistré.' : '',
      },
      { status: response.ok ? 200 : 400 },
    );
  }
  const error = await login(
    String(form.get('email')),
    String(form.get('password')),
  );
  if (error)
    return data(
      { error, email: String(form.get('email') ?? ''), message: '' },
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
  const { authenticated, configured, csrf, clients } = loaderData;
  const pending = useNavigation().state !== 'idle';
  return (
    <main id="contenu" className="admin-page">
      <p className="eyebrow">Espace de gestion</p>
      <h1>{authenticated ? 'Gérer la vitrine' : 'Connexion à la gestion'}</h1>
      <p>
        <Link to="/">Retour à la vitrine ↗</Link>
      </p>
      {!authenticated ? (
        <div className="admin-panel paper">
          <p>
            Connectez-vous pour gérer les fiches et les images des projets
            clients.
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
          <div className="admin-toolbar">
            <Link className="button" to="/connect/clients/nouveau">
              Ajouter un projet ↗
            </Link>
            <Form method="post">
              <input type="hidden" name="csrf" value={csrf} />
              <button name="intent" value="logout" className="filter-button">
                Se déconnecter
              </button>
            </Form>
          </div>
          {actionData?.error && <p role="alert">{actionData.error}</p>}
          {actionData?.message && <p role="status">{actionData.message}</p>}
          <h2>Projets clients</h2>
          <p>
            Choisissez un projet pour modifier son nom et ses photos.
            Déplacez-le avec les flèches ou affichez-le sur la vitrine en un
            clic.
          </p>
          {clients.length === 0 && (
            <p>Aucun projet. Ajoutez votre premier projet.</p>
          )}
          <ol className="admin-clients">
            {clients.map((client, index) => (
              <ClientCard
                key={client.slug}
                client={client}
                csrf={csrf}
                first={index === 0}
                last={index === clients.length - 1}
              />
            ))}
          </ol>
        </>
      )}
    </main>
  );
}

function ClientCard({
  client,
  csrf,
  first,
  last,
}: {
  client: Client;
  csrf: string;
  first: boolean;
  last: boolean;
}) {
  const fetcher = useFetcher<typeof action>();
  const pending = fetcher.state !== 'idle';
  const optimisticPublished =
    fetcher.formData?.get('intent') === 'publish'
      ? fetcher.formData.get('published') === 'yes'
      : client.published;
  return (
    <li className="paper admin-project-card" aria-busy={pending}>
      <img
        className="admin-list-thumb"
        src={client.image.replace('/api/v1/client-images/', '/connect/images/')}
        alt=""
        loading="lazy"
      />
      <div className="admin-project-info">
        <h3>{client.name}</h3>
        <p>
          <span className="admin-badge">
            {optimisticPublished ? 'En ligne' : 'Masqué'}
          </span>{' '}
          · {1 + client.gallery.length} photo(s)
        </p>
        <Link className="text-link" to={`/connect/clients/${client.slug}`}>
          Modifier {client.name} ↗
        </Link>
        {client.published && (
          <p>
            <Link to={`/#projet-${client.slug}`}>Voir sur la vitrine ↗</Link>
          </p>
        )}
      </div>
      <fetcher.Form method="post" className="admin-card-actions">
        <input type="hidden" name="csrf" value={csrf} />
        <input type="hidden" name="slug" value={client.slug} />
        <input
          type="hidden"
          name="published"
          value={client.published ? 'no' : 'yes'}
        />
        <button
          className="filter-button"
          name="intent"
          value="publish"
          disabled={pending}
        >
          {pending && fetcher.formData?.get('intent') === 'publish'
            ? 'Mise à jour…'
            : client.published
              ? 'Masquer'
              : 'Publier'}
          <span className="admin-sr-only"> {client.name}</span>
        </button>
      </fetcher.Form>
      <fetcher.Form method="post" className="admin-order-actions">
        <input type="hidden" name="csrf" value={csrf} />
        <input type="hidden" name="slug" value={client.slug} />
        <input type="hidden" name="intent" value="move" />
        <button
          className="filter-button"
          name="direction"
          value="up"
          aria-label={`Monter ${client.name}`}
          disabled={first || pending}
        >
          ↑
        </button>
        <button
          className="filter-button"
          name="direction"
          value="down"
          aria-label={`Descendre ${client.name}`}
          disabled={last || pending}
        >
          ↓
        </button>
      </fetcher.Form>
      {fetcher.data?.error ? (
        <p role="alert">{fetcher.data.error}</p>
      ) : (
        <p className="admin-card-status" role="status">
          {pending ? 'Mise à jour…' : fetcher.data?.message}
        </p>
      )}
    </li>
  );
}
