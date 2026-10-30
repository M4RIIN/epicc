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
            <img
              src={client.image}
              alt={client.alt}
              loading="lazy"
              width={960}
              height={640}
            />
            <figcaption>
              <h3>{client.name}</h3>
              <p>{client.tagline}</p>
              <p>{client.work}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
