import { useLayoutEffect, useState } from 'react';
import { Link } from 'react-router';

function revealHome() {
  delete document.documentElement.dataset.homeLoading;
  document.querySelector('main.vitrine')?.removeAttribute('aria-busy');
}

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [slow, setSlow] = useState(false);

  useLayoutEffect(() => {
    let active = true;
    const main = document.querySelector('main.vitrine');
    document.documentElement.dataset.homeLoading = 'true';
    main?.setAttribute('aria-busy', 'true');
    const timeout = window.setTimeout(() => setSlow(true), 12000);
    const images = Array.from(main?.querySelectorAll('img') ?? []);
    for (const image of images) image.loading = 'eager';
    const sources = new Set(
      Array.from(main?.querySelectorAll('svg image') ?? [])
        .map((image) => image.getAttribute('href'))
        .filter((source): source is string => Boolean(source)),
    );
    const vectors = Array.from(sources, (source) => {
      const image = new Image();
      image.src = source;
      return image;
    });
    const resources = [...images, ...vectors];
    let completed = 0;
    const pending = resources.map(async (image) => {
      try {
        await image.decode();
      } catch {
        /* Une image indisponible ne bloque pas l’accès au site. */
      }
      completed++;
      if (active) setProgress(Math.round((completed / resources.length) * 100));
    });
    void Promise.allSettled([...pending, document.fonts.ready]).then(() => {
      if (active) {
        window.clearTimeout(timeout);
        revealHome();
      }
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      revealHome();
    };
  }, []);

  return (
    <div className="vitrine-loading" aria-label="Chargement du site">
      <div className="vitrine-loading-content">
        <p className="vitrine-loading-brand">
          EPICC<span aria-hidden="true">✳</span>
        </p>
        <p role="status" aria-live="polite">
          Un instant, les images prennent leur place.
        </p>
        <progress
          aria-label="Chargement des images"
          value={progress}
          max={100}
        />
        <p className="vitrine-loading-percent" aria-hidden="true">
          {progress} %
        </p>
        {slow && (
          <div className="vitrine-loading-slow">
            <p>Le chargement prend plus de temps que prévu.</p>
            <button type="button" onClick={revealHome}>
              Afficher le site sans attendre ↗
            </button>
          </div>
        )}
        <Link to="/connect">Connexion à la gestion ↗</Link>
      </div>
    </div>
  );
}
