import { Artwork } from './artwork';
import { projects, type Project } from '../../content/projects';

function ProjectSpread({
  project: { name, lettering, photos, side, page },
  id,
  basePath,
}: {
  project: Project;
  id: string;
  basePath: string;
}) {
  return (
    <figure
      className="vitrine-project"
      id={id}
      data-side={side}
      aria-label={name}
    >
      <div className="vitrine-project-photos">
        {photos.map(({ mirror, ...photo }) => (
          <Artwork
            key={photo.file}
            {...photo}
            sizes="(max-width: 900px) 46vw, (max-width: 1440px) 32vw, 460px"
            className={mirror ? 'vitrine-project-mirror' : ''}
          />
        ))}
      </div>
      <figcaption className="vitrine-project-caption">
        <h3>
          {lettering ? (
            <Artwork
              {...lettering}
              alt={name}
              sizes="(max-width: 900px) 43vw, 240px"
            />
          ) : (
            name
          )}
        </h3>
        {page && (
          <div className="vitrine-project-details">
            <a
              href={basePath + page.path}
              aria-label={`Voir la fiche — ${name}`}
            >
              Voir la fiche
              <span className="vitrine-project-arrow" aria-hidden="true" />
            </a>
            <div className="vitrine-project-preview" aria-hidden="true">
              <Artwork
                file={page.previewFile}
                width={300}
                height={180}
                sizes="300px"
              />
            </div>
          </div>
        )}
      </figcaption>
    </figure>
  );
}

export function Projects({ basePath }: { basePath: string }) {
  return (
    <section
      className="vitrine-projects"
      id="projets"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title">Les projets clients</h2>
      <fieldset className="vitrine-projects-catalogue">
        <legend className="vitrine-sr-only">Projet à afficher</legend>
        <ol className="vitrine-project-index" role="list">
          {projects.map((project, index) => {
            const id = `projet-${index + 1}`;
            return (
              <li key={project.name}>
                <input
                  className="vitrine-sr-only"
                  type="radio"
                  name="projet-client"
                  id={`${id}-select`}
                  aria-controls={id}
                  defaultChecked={index === 0}
                />
                <label htmlFor={`${id}-select`}>
                  <span className="vitrine-project-number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {project.name}
                </label>
                <ProjectSpread project={project} id={id} basePath={basePath} />
              </li>
            );
          })}
        </ol>
      </fieldset>
    </section>
  );
}
