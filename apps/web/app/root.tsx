import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  isRouteErrorResponse,
  useLocation,
} from 'react-router';
import type { Route } from './+types/root';
import type { ReactNode } from 'react';
import './styles.css';

export function Layout({ children }: { children: ReactNode }) {
  const isHome = useLocation().pathname === '/';
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        {!isHome && (
          <header className="site-header">
            <Link className="brand" to="/" aria-label="EPICC, accueil">
              EPICC<span aria-hidden="true">✳</span>
            </Link>
            <nav aria-label="Navigation principale">
              <Link to="/clients#clients">Les rencontres</Link>
              <Link to="/#a-propos">Le studio</Link>
              <Link className="nav-connect" to="/connect">
                Espace de gestion <span aria-hidden="true">↗</span>
              </Link>
            </nav>
          </header>
        )}
        {children}
        {!isHome && (
          <footer className="site-footer">
            <Link className="brand" to="/">
              EPICC<span aria-hidden="true">✳</span>
            </Link>
            <p>Des idées, des liens, de belles histoires.</p>
            <span>STUDIO INDÉPENDANT · ESPRIT COLLECTIF</span>
          </footer>
        )}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const title =
    status === 404
      ? 'Cette page reste à écrire.'
      : 'Un instant, nous revenons.';
  return (
    <main id="contenu" className="error-page">
      <p className="eyebrow">Erreur {status}</p>
      <h1>{title}</h1>
      <p>
        {status === 404
          ? 'La page demandée est introuvable.'
          : 'Le contenu est temporairement indisponible. Réessayez dans quelques instants.'}
      </p>
      <Link className="button" to="/">
        Revenir à l’accueil <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
