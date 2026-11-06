import { ImageInput } from '../components/image-input';
import { data, Form, Link, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/manage-offer';
import {
  requireAdmin,
  imageLimit,
  readAdminForm,
  verifyCsrf,
} from '../services/admin.server';
import { loadOffers, saveOffer } from '../services/offers.server';

export { headers } from './connect';
export function meta() {
  return [
    { title: 'Image de l’offre | EPICC' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}
export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAdmin(request);
  const offers = await loadOffers();
  const index = offers.findIndex((offer) => offer.slug === params.slug);
  const offer = offers[index];
  if (!offer) throw new Response('Offre introuvable.', { status: 404 });
  return {
    maxImageBytes: imageLimit(),
    offer,
    large: index % 2 === 0,
    csrf: session.get('csrf') as string,
  };
}
export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);
  const form = await readAdminForm(request);
  verifyCsrf(request, form, session);
  const outgoing = new FormData();
  const alt = String(form.get('alt') ?? '');
  const target = form.get('target') === 'hover' ? 'hover' : 'image';
  outgoing.set('target', target);
  outgoing.set('alt', alt);
  if (form.get('removeImage') === 'yes') outgoing.set('removeImage', 'yes');
  const image = form.get('imageFile');
  if (image instanceof File && image.size) outgoing.set('image', image);
  const error = await saveOffer(params.slug, outgoing);
  if (error) return data({ error, alt, target }, { status: 400 });
  return redirect('/connect');
}
export default function ManageOffer({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { offer, csrf, large } = loaderData;
  const pending = useNavigation().state !== 'idle';
  return (
    <main id="contenu" className="admin-page">
      <Link to="/connect">← Retour à la gestion</Link>
      <h1>Image : {offer.name}</h1>
      <p>
        {large ? 'Grand format' : 'Petit format'} · La taille suit l’alternance
        des offres.
      </p>
      {(['image', 'hover'] as const).map((target) => {
        const hover = target === 'hover';
        const image = hover ? offer.hoverImage : offer.image;
        const alt = (hover ? offer.hoverAlt : offer.alt) ?? '';
        const error = actionData?.target === target ? actionData : undefined;
        return (
          <Form
            key={target}
            aria-label={hover ? 'Image de survol' : 'Image dans la page'}
            method="post"
            encType="multipart/form-data"
            className="admin-form admin-panel paper"
          >
            <h2>{hover ? 'Image de survol' : 'Image dans la page'}</h2>
            <input type="hidden" name="target" value={target} />
            <input type="hidden" name="csrf" value={csrf} />
            {error?.error && (
              <p role="alert">
                {error.error} Si vous aviez sélectionné un fichier,
                sélectionnez-le à nouveau.
              </p>
            )}
            {image ? (
              <img className="admin-preview" src={image} alt={alt} />
            ) : (
              <p>Aucune image pour cette offre.</p>
            )}
            <ImageInput
              maxBytes={loaderData.maxImageBytes}
              label={
                hover
                  ? 'Importer le visuel de survol'
                  : 'Remplacer par une image'
              }
            />
            <p>
              {hover
                ? 'Visible au survol et au clavier, sous les mentions manuscrites. Sur écran tactile, elle reste affichée.'
                : 'L’image est recadrée pour conserver le format de l’offre.'}
            </p>
            <label>
              {hover
                ? 'Description du visuel de survol'
                : 'Texte alternatif de l’image'}
              <input
                name="alt"
                defaultValue={error?.alt ?? alt}
                maxLength={300}
              />
            </label>
            <p>
              Décrivez l’image pour les lecteurs d’écran. Obligatoire si une
              image est enregistrée.
            </p>
            {image && (
              <label className="admin-checkbox">
                <input type="checkbox" name="removeImage" value="yes" />
                {hover
                  ? 'Retirer le visuel de survol'
                  : 'Retirer l’image actuelle'}
              </label>
            )}
            <button className="button" disabled={pending}>
              {pending
                ? 'Enregistrement…'
                : hover
                  ? 'Enregistrer le survol'
                  : 'Enregistrer l’image'}
            </button>
          </Form>
        );
      })}
    </main>
  );
}
