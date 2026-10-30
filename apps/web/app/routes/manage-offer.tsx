import { data, Form, Link, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/manage-offer';
import {
  requireAdmin,
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
  return { offer, large: index % 2 === 0, csrf: session.get('csrf') as string };
}
export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);
  const form = await readAdminForm(request);
  verifyCsrf(request, form, session);
  const outgoing = new FormData();
  const alt = String(form.get('alt') ?? '');
  outgoing.set('alt', alt);
  if (form.get('removeImage') === 'yes') outgoing.set('removeImage', 'yes');
  const image = form.get('imageFile');
  if (image instanceof File && image.size) outgoing.set('image', image);
  const error = await saveOffer(params.slug, outgoing);
  if (error) return data({ error, alt }, { status: 400 });
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
        {offer.image ? (
          <img className="admin-preview" src={offer.image} alt={offer.alt} />
        ) : (
          <p>Aucune image pour cette offre.</p>
        )}
        <label>
          Remplacer par une image
          <input
            type="file"
            name="imageFile"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
        <p>
          JPEG, PNG ou WebP, 5 Mo maximum. L’image est recadrée pour conserver
          le format de l’offre.
        </p>
        <label>
          Texte alternatif de l’image
          <input
            name="alt"
            defaultValue={actionData?.alt ?? offer.alt}
            maxLength={300}
          />
        </label>
        <p>
          Décrivez l’image pour les lecteurs d’écran. Obligatoire si une image
          est enregistrée.
        </p>
        {offer.image && (
          <label className="admin-checkbox">
            <input type="checkbox" name="removeImage" value="yes" />
            Retirer l’image actuelle
          </label>
        )}
        <button className="button" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer l’image'}
        </button>
      </Form>
    </main>
  );
}
