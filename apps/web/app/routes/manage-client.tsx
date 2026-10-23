import { data, Form, Link, redirect, useNavigation } from 'react-router';
import { clientSchema } from '@epicc/content-contracts';
import type { Client } from '@epicc/content-contracts';
import type { Route } from './+types/manage-client';
import {
  requireAdmin,
  verifyCsrf,
  readAdminForm,
} from '../services/admin.server';
import { loadClients, saveClient } from '../services/clients.server';

export { headers } from './connect';
export function meta() {
  return [
    { title: 'Modifier une fiche client | EPICC' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}
const fields = [
  ['name', 'Nom', 150],
  ['number', 'Numéro de fiche', 10],
  ['sector', 'Univers', 100],
  ['place', 'Ville', 150],
  ['year', 'Année', 4],
  ['tagline', 'Légende de l’image', 300],
  ['description', 'Présentation et description SEO', 2000],
  ['need', 'Besoin du client', 3000],
  ['work', 'Prestations (séparées par « · »)', 1500],
  ['note', 'Note dans la marge', 2000],
  ['signature', 'Signature du client', 200],
  ['alt', 'Texte alternatif de l’image', 300],
] as const;
const defaultClient: Client = {
  slug: '',
  number: '',
  name: '',
  sector: '',
  place: '',
  year: '2026',
  image: '/images/botanique.jpg',
  alt: '',
  tagline: '',
  description: '',
  need: '',
  work: '',
  note: '',
  signature: '',
  color: 'sage',
  published: false,
  position: 0,
};
export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAdmin(request);
  const clients = await loadClients(true);
  const creating = params.slug === 'nouveau';
  const client = creating
    ? {
        ...defaultClient,
        number: String(clients.length + 1).padStart(2, '0'),
        position: Math.max(-1, ...clients.map((c) => c.position)) + 1,
      }
    : clients.find((c) => c.slug === params.slug);
  if (!client) throw new Response('Fiche introuvable.', { status: 404 });
  return { creating, client, csrf: session.get('csrf') as string };
}
export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);
  const form = await readAdminForm(request);
  verifyCsrf(request, form, session);
  const creating = params.slug === 'nouveau';
  if (form.get('intent') === 'delete') {
    if (creating || form.get('confirmDelete') !== 'yes')
      return data(
        { error: 'Confirmez la suppression de cette fiche.', values: null },
        { status: 400 },
      );
    const error = await saveClient(params.slug, form);
    if (error) return data({ error, values: null }, { status: 400 });
    return redirect('/connect');
  }
  const values = {
    ...Object.fromEntries(
      Object.keys(clientSchema.shape).map((key) => [
        key,
        String(form.get(key) ?? ''),
      ]),
    ),
    slug: creating ? String(form.get('slug')) : params.slug,
    published: form.get('published') === 'on',
    position: Number(form.get('position')),
  };
  const result = clientSchema.safeParse(values);
  if (!result.success)
    return data(
      {
        error: result.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(' '),
        values,
      },
      { status: 400 },
    );
  if (result.data.slug === 'nouveau')
    return data(
      { error: 'Cette adresse est réservée. Choisissez-en une autre.', values },
      { status: 400 },
    );
  const outgoing = new FormData();
  outgoing.set('client', JSON.stringify(result.data));
  outgoing.set('intent', creating ? 'create' : 'update');
  const image = form.get('imageFile');
  if (image instanceof File && image.size) outgoing.set('image', image);
  const error = await saveClient(result.data.slug, outgoing);
  if (error) return data({ error, values }, { status: 400 });
  return redirect('/connect');
}
export default function ManageClient({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { creating, csrf } = loaderData;
  const client = { ...loaderData.client, ...actionData?.values };
  const pending = useNavigation().state !== 'idle';
  return (
    <main id="contenu" className="admin-page">
      <Link to="/connect">← Retour à la liste des clients</Link>
      <h1>
        {creating ? 'Ajouter un client' : `Modifier ${loaderData.client.name}`}
      </h1>
      <Form
        method="post"
        encType="multipart/form-data"
        className="admin-form admin-panel paper"
      >
        <input type="hidden" name="csrf" value={csrf} />
        {actionData?.error && (
          <p role="alert">
            {actionData.error} Si vous aviez sélectionné un fichier,
            sélectionnez-le à nouveau.
          </p>
        )}
        <label>
          Adresse de la fiche
          <input
            name="slug"
            defaultValue={client.slug}
            readOnly={!creating}
            required
            maxLength={100}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </label>
        <p>
          L’adresse reste stable après création pour préserver les liens et le
          référencement.
        </p>
        {fields.map(([name, label, max]) => (
          <label key={name}>
            {label}
            {max >= 1000 ? (
              <textarea
                name={name}
                defaultValue={String(client[name])}
                required
                maxLength={max}
                rows={4}
              />
            ) : (
              <input
                name={name}
                defaultValue={String(client[name])}
                required
                maxLength={max}
              />
            )}
          </label>
        ))}
        <label>
          Couleur de la fiche
          <select name="color" defaultValue={client.color}>
            <option value="sage">Sauge</option>
            <option value="peach">Pêche</option>
            <option value="yellow">Jaune</option>
          </select>
        </label>
        <label>
          Ordre d’affichage
          <input
            type="number"
            name="position"
            defaultValue={client.position}
            min={0}
            max={99999}
            required
          />
        </label>
        <fieldset>
          <legend>Image</legend>
          <img
            className="admin-preview"
            src={client.image.replace(
              '/api/v1/client-images/',
              '/connect/images/',
            )}
            alt={client.alt || 'Image actuelle'}
          />
          <label>
            Image existante
            <select name="image" defaultValue={client.image}>
              {client.image.startsWith('/api/') && (
                <option value={client.image}>
                  Conserver l’image téléversée
                </option>
              )}
              <option value="/images/botanique.jpg">Végétal</option>
              <option value="/images/atelier.jpg">Atelier</option>
              <option value="/images/cafe.jpg">Café</option>
            </select>
          </label>
          <label>
            Remplacer par une image
            <input
              type="file"
              name="imageFile"
              accept="image/jpeg,image/png,image/webp"
            />
          </label>
          <p>
            JPEG, PNG ou WebP, 5 Mo maximum. Le fichier sélectionné remplace
            l’image existante à l’enregistrement.
          </p>
        </fieldset>
        <label className="admin-checkbox">
          <input
            name="published"
            type="checkbox"
            defaultChecked={client.published}
          />
          Publier sur la vitrine
        </label>
        <p>
          Un brouillon reste invisible aux visiteurs et aux moteurs de
          recherche.
        </p>
        <button className="button" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer la fiche'}
        </button>
      </Form>
      {!creating && (
        <Form method="post" className="admin-panel paper admin-form">
          <input type="hidden" name="csrf" value={csrf} />
          <h2>Supprimer cette fiche</h2>
          <p>
            La fiche sera retirée définitivement de la vitrine et de la gestion.
          </p>
          <label className="admin-checkbox">
            <input type="checkbox" name="confirmDelete" value="yes" required />
            Je confirme la suppression de {loaderData.client.name}
          </label>
          <button
            name="intent"
            value="delete"
            className="filter-button"
            disabled={pending}
          >
            Supprimer définitivement
          </button>
        </Form>
      )}
    </main>
  );
}
