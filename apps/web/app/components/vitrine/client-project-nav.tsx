export function ClientProjectNav({ homePath }: { homePath: string }) {
  return (
    <nav className="project-nav" aria-label="Navigation principale">
      <a href={homePath} aria-label="Menu — accueil EPICC">
        Menu
      </a>
      <ul>
        <li>
          <a href={`${homePath}#a-propos`}>À propos</a>
        </li>
        <li>
          <a href={`${homePath}#prestations`}>Les expertises</a>
        </li>
        <li>
          <a href={`${homePath}#projets`}>Les projets clients</a>
        </li>
      </ul>
    </nav>
  );
}
