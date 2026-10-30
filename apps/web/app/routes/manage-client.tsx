import { data, redirect } from 'react-router';
import { randomUUID } from 'node:crypto';
import { clientSchema } from '@epicc/content-contracts';
import type { Client } from '@epicc/content-contracts';
import type { Route } from './+types/manage-client';
import {
  requireAdmin,
  verifyCsrf,
  readAdminForm,
} from '../services/admin.server';
import { loadClients, saveClient } from '../services/clients.server';
import { ProjectEditor } from '../components/project-editor';

export { headers } from './connect';
export function meta() {
  return [
    { title: 'Gérer un projet | EPICC' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}
const defaultClient: Client = {
  slug: '',
  number: '01',
  name: '',
  sector: 'Projet client',
  place: 'Non renseigné',
  year: '2026',
  image: '/images/botanique.jpg',
  gallery: [],
  alt: '',
  tagline: 'Projet client',
  description: 'Projet client',
  need: 'Non renseigné',
  work: 'Non renseigné',
  note: 'Non renseigné',
  signature: 'Non renseigné',
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
  if (!client) throw new Response('Projet introuvable.', { status: 404 });
  return {
    creating,
    client,
    csrf: session.get('csrf') as string,
    saved: new URL(request.url).searchParams.get('enregistre'),
  };
}
export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);
  const form = await readAdminForm(request);
  verifyCsrf(request, form, session);
  const creating = params.slug === 'nouveau';
  const submitted = {
    name: String(form.get('name') ?? ''),
    alt: String(form.get('alt') ?? ''),
    published: form.get('published') === 'on',
  };
  if (form.get('intent') === 'delete') {
    if (creating || form.get('confirmDelete') !== 'yes')
      return data(
        { error: 'Confirmez la suppression du projet.', values: null },
        { status: 400 },
      );
    const error = await saveClient(params.slug, form);
    if (error) return data({ error, values: submitted }, { status: 400 });
    return redirect('/connect');
  }
  const clients = await loadClients(true);
  const current = creating
    ? {
        ...defaultClient,
        number: String(clients.length + 1).padStart(2, '0'),
        position: Math.max(-1, ...clients.map((c) => c.position)) + 1,
      }
    : clients.find((c) => c.slug === params.slug);
  if (!current) throw new Response('Projet introuvable.', { status: 404 });
  const name = String(form.get('name') ?? '').trim();
  const image = form.get('imageFile');
  if (creating && !(image instanceof File && image.size))
    return data(
      { error: 'Ajoutez une photo principale au projet.', values: submitted },
      { status: 400 },
    );
  let slug = current.slug;
  if (creating) {
    const base =
      name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80)
        .replace(/-$/g, '') || 'projet';
    slug = base;
    let suffix = 2;
    while (slug === 'nouveau' || clients.some((client) => client.slug === slug))
      slug = `${base}-${suffix++}`;
  }
  const outgoing = new FormData();
  const gallery = current.gallery.flatMap((photo, index) => {
    if (form.get(`removeGallery${index}`) === 'yes') return [];
    const replacement = form.get(`galleryReplace${index}`);
    // Recalculer l’indice après les suppressions pour l’API.
    const position = current.gallery
      .slice(0, index)
      .filter((_, i) => form.get(`removeGallery${i}`) !== 'yes').length;
    if (replacement instanceof File && replacement.size)
      outgoing.set(`galleryReplace${position}`, replacement);
    return [
      {
        image: photo.image,
        alt: String(form.get(`galleryAlt${index}`) ?? photo.alt).trim() || name,
      },
    ];
  });
  const result = clientSchema.safeParse({
    ...current,
    slug,
    name,
    alt: String(form.get('alt') ?? current.alt).trim() || name,
    gallery,
    published: form.get('published') === 'on',
  });
  if (!result.success)
    return data(
      {
        values: submitted,
        error: result.error.issues
          .map((issue) =>
            issue.path[0] === 'name'
              ? 'Indiquez le nom du projet (150 caractères maximum).'
              : issue.message,
          )
          .join(' '),
      },
      { status: 400 },
    );
  outgoing.set('client', JSON.stringify(result.data));
  outgoing.set('intent', creating ? 'create' : 'update');
  if (image instanceof File && image.size) outgoing.set('image', image);
  for (const [index, file] of form.getAll('galleryImages').entries()) {
    if (
      !(file instanceof File) ||
      !file.size ||
      form.get(`skipGallery${index}`) === 'yes'
    )
      continue;
    outgoing.append('galleryImages', file);
    outgoing.append(
      'galleryAlts',
      String(form.get(`newGalleryAlt${index}`) ?? '').trim() ||
        `Photo de ${name}`,
    );
  }
  const error = await saveClient(result.data.slug, outgoing);
  if (error) return data({ error, values: submitted }, { status: 400 });
  return redirect(
    `/connect/clients/${result.data.slug}?enregistre=${randomUUID()}`,
  );
}
export default function ManageClient({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <ProjectEditor
      key={`${loaderData.client.slug}:${loaderData.saved}`}
      client={{ ...loaderData.client, ...actionData?.values }}
      creating={loaderData.creating}
      csrf={loaderData.csrf}
      saved={Boolean(loaderData.saved)}
      error={actionData?.error}
    />
  );
}
