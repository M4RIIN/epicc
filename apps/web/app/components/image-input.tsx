import { useEffect, useState } from 'react';

export function ImageInput({ maxBytes }: { maxBytes: number }) {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  return (
    <>
      <label>
        Remplacer par une image
        <input
          type="file"
          name="imageFile"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => {
            const selected = event.currentTarget.files?.[0];
            event.currentTarget.setCustomValidity(
              selected && selected.size > maxBytes
                ? `L’image doit peser au maximum ${maxBytes / 1024 / 1024} Mo.`
                : '',
            );
            setFile(selected);
            setPreview(
              selected && selected.size <= maxBytes
                ? URL.createObjectURL(selected)
                : undefined,
            );
          }}
        />
      </label>
      <p>JPEG, PNG, WebP ou AVIF, {maxBytes / 1024 / 1024} Mo maximum.</p>
      {file && file.size > maxBytes && (
        <p role="alert">L’image sélectionnée est trop volumineuse.</p>
      )}
      {preview && (
        <figure>
          <img
            className="admin-preview"
            src={preview}
            alt="Aperçu avant enregistrement"
          />
          <figcaption>Aperçu avant enregistrement</figcaption>
        </figure>
      )}
    </>
  );
}
