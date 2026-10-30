import { useEffect, useRef, useState } from 'react';
import { Form, Link, useNavigation } from 'react-router';
import type { Client } from '@epicc/content-contracts';

function privateImage(src: string) {
  return src.replace('/api/v1/client-images/', '/connect/images/');
}
function PhotoPreview({
  file,
  src,
  alt,
}: {
  file?: File | undefined;
  src?: string | undefined;
  alt: string;
}) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return file || src ? (
    <img
      ref={image}
      className="admin-preview"
      src={file ? undefined : src}
      alt={alt}
    />
  ) : (
    <div className="admin-photo-empty">
      Choisissez une photo
      <br />
      <span>JPEG, PNG ou WebP</span>
    </div>
  );
}
function validateFiles(files: File[], maximum: number) {
  if (files.length > maximum)
    return `Vous pouvez ajouter ${maximum} photo${maximum > 1 ? 's' : ''} supplémentaire${maximum > 1 ? 's' : ''}.`;
  if (
    files.some(
      (file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    )
  )
    return 'Choisissez des photos JPEG, PNG ou WebP.';
  if (files.some((file) => file.size > 5 * 1024 * 1024))
    return 'Chaque photo doit peser 5 Mo maximum.';
  return '';
}
function ExistingPhoto({
  photo,
  index,
  onRemoved,
}: {
  photo: Client['gallery'][number];
  index: number;
  onRemoved: (removed: boolean) => void;
}) {
  const [file, setFile] = useState<File>();
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className={`admin-photo-card ${removed ? 'admin-photo-removed' : ''}`}>
      {!removed && (
        <>
          <PhotoPreview
            src={privateImage(photo.image)}
            file={file}
            alt={photo.alt}
          />
          <label>
            Remplacer la photo {index + 2}
            <input
              type="file"
              name={`galleryReplace${index}`}
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const selected = Array.from(event.currentTarget.files ?? []);
                const message = validateFiles(selected, 1);
                event.currentTarget.setCustomValidity(message);
                setError(message);
                setFile(message ? undefined : selected[0]);
              }}
            />
          </label>
          <label>
            Description de la photo {index + 2}
            <input
              name={`galleryAlt${index}`}
              defaultValue={photo.alt}
              maxLength={300}
            />
          </label>
          {error && <p role="alert">{error}</p>}
        </>
      )}
      <label className="admin-checkbox">
        <input
          type="checkbox"
          name={`removeGallery${index}`}
          value="yes"
          checked={removed}
          onChange={(event) => {
            setRemoved(event.currentTarget.checked);
            setFile(undefined);
            setError('');
            onRemoved(event.currentTarget.checked);
          }}
        />
        {removed
          ? `Photo ${index + 2} retirée · décocher pour annuler`
          : `Retirer la photo ${index + 2}`}
      </label>
    </div>
  );
}
export function ProjectEditor({
  client,
  creating,
  csrf,
  saved,
  error,
}: {
  client: Client;
  creating: boolean;
  csrf: string;
  saved: boolean;
  error?: string | undefined;
}) {
  const pending = useNavigation().state !== 'idle';
  const [name, setName] = useState(client.name);
  const [dirty, setDirty] = useState(false);
  const [mainFile, setMainFile] = useState<File>();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedNew, setRemovedNew] = useState<number[]>([]);
  const [removedExisting, setRemovedExisting] = useState<number[]>([]);
  const available = 3 - client.gallery.length + removedExisting.length;
  const [fileError, setFileError] = useState('');
  return (
    <main id="contenu" className="admin-page admin-editor">
      <Link to="/connect">← Tous les projets</Link>
      <div className="admin-editor-heading">
        <div>
          <p className="eyebrow">Les projets clients</p>
          <h1>{creating ? 'Nouveau projet' : client.name}</h1>
        </div>
        {client.published && (
          <Link className="text-link" to={`/#projet-${client.slug}`}>
            Voir sur la vitrine ↗
          </Link>
        )}
      </div>
      <Form
        method="post"
        encType="multipart/form-data"
        className="admin-form"
        onChange={() => setDirty(true)}
        aria-busy={pending}
      >
        <input type="hidden" name="csrf" value={csrf} />
        <section className="admin-panel paper admin-form">
          <label>
            Nom du projet
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              required
              maxLength={150}
              placeholder="Ex. Casamatta"
            />
          </label>
          <label className="admin-checkbox">
            <input
              name="published"
              type="checkbox"
              defaultChecked={client.published}
            />
            Afficher sur la vitrine
          </label>
          <p className="admin-help">
            Le nom et les photos sont affichés dans « Les projets clients ». Un
            projet masqué reste accessible ici.
          </p>
        </section>
        <section
          id="image-projet"
          className="admin-panel paper admin-form"
          aria-labelledby="photos-title"
        >
          <div>
            <h2 id="photos-title">Les photos du projet</h2>
            <p className="admin-help">
              Une photo principale et jusqu’à trois photos complémentaires. 5 Mo
              par photo. Aperçu immédiat avant enregistrement.
            </p>
          </div>
          <div className="admin-photo-grid">
            <div className="admin-photo-card">
              <span className="admin-badge">Photo principale</span>
              <PhotoPreview
                src={creating ? undefined : privateImage(client.image)}
                file={mainFile}
                alt={name || 'Photo principale'}
              />
              <label>
                {creating
                  ? 'Ajouter la photo principale'
                  : 'Remplacer la photo principale'}
                <input
                  type="file"
                  name="imageFile"
                  accept="image/jpeg,image/png,image/webp"
                  required={creating}
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? []);
                    const message = validateFiles(files, 1);
                    event.currentTarget.setCustomValidity(message);
                    setFileError(message);
                    setMainFile(message ? undefined : files[0]);
                  }}
                />
              </label>
              <label>
                Description de la photo principale
                <input
                  name="alt"
                  defaultValue={client.alt}
                  placeholder={name || 'Décrivez la photo'}
                  maxLength={300}
                />
              </label>
            </div>
            {client.gallery.map((photo, index) => (
              <ExistingPhoto
                key={photo.image}
                photo={photo}
                index={index}
                onRemoved={(removed) => {
                  setRemovedExisting((indices) =>
                    removed
                      ? [...indices, index]
                      : indices.filter((i) => i !== index),
                  );
                  setDirty(true);
                }}
              />
            ))}
            {newFiles.map((file, index) => (
              <div className="admin-photo-card" key={`${file.name}:${index}`}>
                {removedNew.includes(index) ? (
                  <>
                    <input
                      type="hidden"
                      name={`skipGallery${index}`}
                      value="yes"
                    />
                    <p>Photo retirée</p>
                    <button
                      type="button"
                      className="filter-button"
                      onClick={() => {
                        setRemovedNew((removed) =>
                          removed.filter((i) => i !== index),
                        );
                        setDirty(true);
                      }}
                    >
                      Annuler le retrait de {file.name}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="admin-badge">Nouvelle photo</span>
                    <PhotoPreview file={file} alt={name || 'Nouvelle photo'} />
                    <label>
                      Description de la nouvelle photo {index + 1}
                      <input
                        name={`newGalleryAlt${index}`}
                        maxLength={300}
                        placeholder={`Photo de ${name}`}
                      />
                    </label>
                    <button
                      type="button"
                      className="filter-button"
                      onClick={() => {
                        setRemovedNew((removed) => [...removed, index]);
                        setDirty(true);
                      }}
                    >
                      Retirer {file.name}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          {available > 0 && (
            <label className="admin-upload">
              Ajouter des photos complémentaires
              <input
                name="galleryImages"
                aria-label="Ajouter des photos complémentaires"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  const message = validateFiles(files, available);
                  event.currentTarget.setCustomValidity(message);
                  setFileError(message);
                  setNewFiles(message ? [] : files);
                  setRemovedNew([]);
                }}
              />
              <span className="admin-help">
                Sélectionnez jusqu’à {available} photo(s) en une fois. Elles
                seront ajoutées après les photos existantes.
              </span>
            </label>
          )}
          {fileError && <p role="alert">{fileError}</p>}
        </section>
        <div className="admin-save-bar">
          <p role="status" aria-live="polite">
            {pending
              ? 'Enregistrement en cours…'
              : dirty
                ? 'Modifications non enregistrées'
                : error
                  ? 'Enregistrement à corriger'
                  : saved
                    ? 'Projet enregistré.'
                    : 'Prêt à modifier'}
          </p>
          <button className="button" disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer le projet'}
          </button>
        </div>
        {error && (
          <p role="alert">
            {error} Vérifiez les champs et les photos sélectionnées.
          </p>
        )}
      </Form>
      {!creating && (
        <details className="admin-delete">
          <summary>Supprimer ce projet</summary>
          <Form method="post" className="admin-form">
            <input type="hidden" name="csrf" value={csrf} />
            <p>Le projet et ses photos seront retirés définitivement.</p>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                name="confirmDelete"
                value="yes"
                required
              />
              Je confirme la suppression de {client.name}
            </label>
            <button
              className="filter-button"
              name="intent"
              value="delete"
              disabled={pending}
            >
              Supprimer définitivement
            </button>
          </Form>
        </details>
      )}
    </main>
  );
}
