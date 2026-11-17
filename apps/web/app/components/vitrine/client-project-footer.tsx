type ClientProjectFooterProps = {
  homePath: string;
  name: string;
  description: string;
};

export function ClientProjectFooter({
  homePath,
  name,
  description,
}: ClientProjectFooterProps) {
  return (
    <footer className="project-footer">
      <nav aria-label="Fil d’Ariane">
        <a href={homePath}>EPICC</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{name}</span>
      </nav>
      <h2>{name}</h2>
      <p>{description}</p>
      <a href={`${homePath}#projets`}>← Tous les projets</a>
      <a href={`${homePath}#contact`}>Parlons de votre identité visuelle ↗</a>
    </footer>
  );
}
