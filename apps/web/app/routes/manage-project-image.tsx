import { ImageInput } from '../components/image-input';
import { data, Form, Link, redirect, useNavigation } from 'react-router';
import { vitrineProjects } from '@epicc/content-contracts';
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
  const project = vitrineProjects.find((item) =>
    item.pieces.some((piece) => piece.file === params.file),
  );
  const piece = project?.pieces.find((item) => item.file === params.file);
  if (!project || !piece)
    throw new Response('Visuel introuvable.', { status: 404 });
  const image = (await loadProjectImages()).find(
    (item) => item.file === params.file,
  )!;
  return {
    maxImageBytes: imageLimit(),
    project: project.name,
    side: project.side,
    imageNumber:
      project.pieces
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
  const { project, piece, image, csrf, side, imageNumber } = loaderData;
  const pending = useNavigation().state !== 'idle';
  return (
    <main id="contenu" className="admin-page">
      <Link to="/connect#project-images">← Retour aux projets clients</Link>
      <p className="eyebrow">
        Colonne {side === 'left' ? 'gauche' : 'droite'} /{' '}
        {piece.role === 'name' ? 'Titre' : 'Photo'} {imageNumber}
      </p>
      <h1>{project}</h1>
      <p>
        Remplacez ce visuel dans sa série. Le titre et la première photo restent
        alignés ; les proportions et l’ordre des photos sont conservés.
      </p>
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
        <div
          className="admin-project-preview"
          style={{ aspectRatio: piece.width / piece.height }}
        >
          <img
            src={image.image ?? `/images/vitrine/projets-${piece.file}`}
            alt={image.alt}
            style={{
              objectFit: piece.role === 'name' ? 'contain' : 'cover',
              transform: piece.mirror ? 'scaleX(-1)' : undefined,
            }}
          />
        </div>
        <ImageInput maxBytes={loaderData.maxImageBytes} />
        <p>
          Pour un rendu fidèle, privilégiez les proportions de l’aperçu et un
          fond transparent pour les logos.
        </p>
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
          {pending ? 'Enregistrement…' : 'Enregistrer l’image'}
        </button>
      </Form>
      <Form method="post" className="admin-panel paper admin-form">
        <input type="hidden" name="csrf" value={csrf} />
        <h2>Revenir au visuel d’origine</h2>
        <p>Rétablit l’image et son texte alternatif d’origine.</p>
        <button
          className="filter-button"
          name="restore"
          value="yes"
          disabled={pending}
        >
          Rétablir l’original
        </button>
      </Form>
    </main>
  );
}
