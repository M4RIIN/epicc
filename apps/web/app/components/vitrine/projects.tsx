import type { Client } from '@epicc/content-contracts';

export function Projects({ clients }: { clients: Client[] }) {
  return (
    <section
      className="vitrine-projects"
      id="projets-clients"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title">Les projets clients</h2>
      <div className="vitrine-projects-list">
        {clients.map((client) => (
          <figure
            className="vitrine-project"
            id={`projet-${client.slug}`}
            key={client.slug}
          >
            <div className="vitrine-project-photos">
              {[
                { image: client.image, alt: client.alt },
                ...client.gallery,
              ].map((photo, index) => (
                <img
                  key={photo.image}
                  src={photo.image}
                  alt={photo.alt}
                  loading="lazy"
                  className={
                    index % 2 === 0
                      ? 'vitrine-project-photo-large'
                      : 'vitrine-project-photo-small'
                  }
                />
              ))}
            </div>
            <figcaption>
              <h3>{client.name}</h3>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
