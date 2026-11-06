import { ImageInput } from '../components/image-input';
import { data, Form, Link, redirect, useNavigation } from 'react-router';
import { projectClients, clientPieces } from '@epicc/content-contracts';
import type { Route } from './+types/manage-project-image';
import {
  requireAdmin,
  imageLimit,
  readAdminForm,
  verifyCsrf,
} from '../services/admin.server';
import {
  loadProjectImages,
  saveProjectImage,
} from '../services/projects.server';

export { headers } from './connect';
export function meta() {
  return [
    { title: 'Image du projet client | EPICC' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}
export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAdmin(request);
  const images = await loadProjectImages();
  const creating = params.file === 'nouvelle';
  const project = projectClients.find((item) =>
    creating
      ? item.name === new URL(request.url).searchParams.get('project')
      : clientPieces(item, images).some((piece) => piece.file === params.file),
  );
  const piece = creating
    ? { file: 'nouvelle', role: 'photo' as const, width: 222, height: 333 }
    : project &&
      clientPieces(project, images).find((item) => item.file === params.file);
  if (!project || !piece)
    throw new Response('Visuel introuvable.', { status: 404 });
  const image = images.find((item) => item.file === params.file) ?? {
    file: 'nouvelle',
    image: null,
    alt: '',
    size: 'medium' as const,
  };
  return {
    creating,
    original:
      !creating && project.pieces.some((item) => item.file === params.file),
    maxImageBytes: imageLimit(),
    project: project.name,
    side: project.side,
    imageNumber:
      clientPieces(project, images)
        .filter((item) => item.role === piece.role)
        .findIndex((item) => item.file === piece.file) + 1,
    piece,
    image,
    csrf: session.get('csrf') as string,
  };
}
export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);
  const form = await readAdminForm(request);
  verifyCsrf(request, form, session);
  const outgoing = new FormData();
  const alt = String(form.get('alt') ?? '');
  outgoing.set('alt', alt);
  if (form.get('restore') === 'yes') outgoing.set('restore', 'yes');
  if (form.get('intent') === 'delete') {
    if (form.get('confirmDelete') !== 'yes')
      return data({ error: 'Confirmez la suppression.', alt }, { status: 400 });
    outgoing.set('intent', 'delete');
  }
  outgoing.set('project', String(form.get('project') ?? ''));
  if (form.has('size')) outgoing.set('size', String(form.get('size')));
  const file = form.get('imageFile');
  if (file instanceof File && file.size) outgoing.set('image', file);
  const error = await saveProjectImage(params.file, outgoing);
  if (error) return data({ error, alt }, { status: 400 });
  return redirect('/connect#project-images');
}
export default function ManageProjectImage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { project, piece, image, csrf, side, imageNumber, creating, original } =
    loaderData;
  const pending = useNavigation().state !== 'idle';
  return (
    <main id="contenu" className="admin-page">
      <Link to="/connect#project-images">← Retour aux projets clients</Link>
      <p className="eyebrow">
        Colonne {side === 'left' ? 'gauche' : 'droite'} /{' '}
        {piece.role === 'name' ? 'Logo' : 'Photo'} {creating ? '' : imageNumber}
      </p>
      <h1>{project}</h1>
      <p>
        {creating
          ? 'Ajoutez une photo à ce client. Vous pouvez en ajouter autant que nécessaire.'
          : 'Remplacez ce visuel ou choisissez sa taille d’affichage. Les proportions sont conservées.'}
      </p>
      <Form
        method="post"
        encType="multipart/form-data"
        className="admin-form admin-panel paper"
      >
        <input type="hidden" name="csrf" value={csrf} />
        <input type="hidden" name="project" value={project} />
        {actionData?.error && (
          <p role="alert">
            {actionData.error} Si vous aviez sélectionné un fichier,
            sélectionnez-le à nouveau.
          </p>
        )}
        {!creating && (
          <div
            className="admin-project-preview"
            style={{ aspectRatio: piece.width / piece.height }}
          >
            <img
              src={image.image ?? undefined}
              alt={image.alt}
              style={{
                objectFit: piece.role === 'name' ? 'contain' : 'cover',
                transform: piece.mirror ? 'scaleX(-1)' : undefined,
              }}
            />
          </div>
        )}
        <ImageInput
          maxBytes={loaderData.maxImageBytes}
          label={creating ? 'Photo à ajouter' : 'Remplacer par une image'}
          required={creating}
        />
        <p>
          Pour un rendu fidèle, privilégiez les proportions de l’aperçu et un
          fond transparent pour les logos.
        </p>
        {piece.role === 'photo' && (
          <label>
            Taille d’affichage
            <select
              name="size"
              defaultValue={image.size ?? ''}
              required={creating}
            >
              {original && (
                <option value="">Dimensions actuelles de la vitrine</option>
              )}
              <option value="small">Petite</option>
              <option value="medium">Moyenne</option>
              <option value="large">Grande</option>
            </select>
          </label>
        )}
        <label>
          Texte alternatif de l’image
          <input
            name="alt"
            defaultValue={actionData?.alt ?? image.alt}
            maxLength={300}
            required
          />
        </label>
        <p>
          Décrivez le contenu du visuel pour l’accessibilité et le
          référencement. La modification est publiée dès l’enregistrement.
        </p>
        <button className="button" disabled={pending}>
          {pending
            ? 'Enregistrement…'
            : creating
              ? 'Ajouter la photo'
              : 'Enregistrer l’image'}
        </button>
      </Form>
      {!creating && (
        <Form method="post" className="admin-panel paper admin-form">
          <input type="hidden" name="csrf" value={csrf} />
          <h2>
            {original ? 'Revenir au visuel d’origine' : 'Supprimer cette photo'}
          </h2>
          <p>
            {original
              ? 'Rétablit l’image, ses dimensions et son texte alternatif d’origine.'
              : 'Retire cette photo de la vitrine.'}
          </p>
          {!original && (
            <label className="admin-checkbox">
              <input
                type="checkbox"
                name="confirmDelete"
                value="yes"
                required
              />
              Je confirme la suppression de cette photo
            </label>
          )}
          <button
            className="filter-button"
            name={original ? 'restore' : 'intent'}
            value={original ? 'yes' : 'delete'}
            disabled={pending}
          >
            {original ? 'Rétablir l’original' : 'Supprimer la photo'}
          </button>
        </Form>
      )}
    </main>
  );
}
