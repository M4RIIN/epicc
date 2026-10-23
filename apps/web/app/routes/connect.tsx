import { Link } from 'react-router';

export function meta() {
  return [
    { title: 'Espace de gestion | EPICC' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export function headers() {
  return { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };
}

export default function Connect() {
  return (
    <main id="contenu" className="connect-page">
      <p className="eyebrow">Espace de gestion</p>
      <span className="connect-symbol" aria-hidden="true">
        ✳
      </span>
      <h1>Les coulisses de votre prochain chapitre.</h1>
      <p>Cet espace accueillera la gestion des contenus de votre vitrine.</p>
      <div className="notice">
        <span className="status-dot" />
        <p>
          En préparation. L’authentification et l’édition des contenus ne sont
          pas encore disponibles.
        </p>
      </div>
      <Link className="button" to="/">
        Retour à la vitrine <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
