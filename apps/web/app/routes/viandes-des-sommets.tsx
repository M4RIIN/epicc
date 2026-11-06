import { loadVitrineImages } from '../services/vitrine-images.server';
import { VitrineMedia } from '../components/vitrine/media';
import { Artwork } from '../components/vitrine/artwork';
import { Link } from 'react-router';
import type { Route } from './+types/viandes-des-sommets';
import { getSiteOrigin } from '../services/site.server';
import '../components/vitrine/client-project.css';

const path = '/clients/viandes-des-sommets';
const title = 'Viandes des Sommets — Identité visuelle & logo | EPICC';
const description =
  'Découvrez l’identité visuelle de Viandes des Sommets par EPICC : construction du logo, univers photographique, packaging et déclinaisons de marque.';
const imageRoot = 'viandes-des-sommets/';

export async function loader() {
  const images = await loadVitrineImages();
  return {
    origin: getSiteOrigin(),
    images,
    cover: images.find((image) => image.file === `${imageRoot}ouverture.webp`)!
      .image,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData)
    return [
      { title: 'Projet introuvable | EPICC' },
      { name: 'robots', content: 'noindex' },
    ];
  const url = `${loaderData.origin}${path}`;
  const image = `${loaderData.origin}${loaderData.cover}`;
  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'EPICC' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    {
      property: 'og:image:alt',
      content: 'Univers de marque Viandes des Sommets',
    },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': url,
            url,
            name: title,
            description,
            inLanguage: 'fr-FR',
            isPartOf: { '@id': `${loaderData.origin}/#site` },
            primaryImageOfPage: { '@type': 'ImageObject', url: image },
            mainEntity: { '@id': `${url}#projet` },
            breadcrumb: { '@id': `${url}#fil-ariane` },
          },
          {
            '@type': 'CreativeWork',
            '@id': `${url}#projet`,
            name: 'Viandes des Sommets — Identité visuelle',
            description,
            image,
            url,
            inLanguage: 'fr-FR',
            creator: {
              '@type': 'Organization',
              '@id': `${loaderData.origin}/#organisation`,
              name: 'EPICC',
            },
            about: { '@type': 'Organization', name: 'Viandes des Sommets' },
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${url}#fil-ariane`,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Accueil',
                item: `${loaderData.origin}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Viandes des Sommets',
                item: url,
              },
            ],
          },
        ],
      },
    },
  ];
}

function ProjectImage({
  name,
  alt,
  width,
  height,
  eager = false,
}: {
  name: string;
  alt: string;
  width: number;
  height: number;
  eager?: boolean;
}) {
  return (
    <Artwork
      file={`${imageRoot}${name}.webp`}
      sizes="100vw"
      alt={alt}
      width={width}
      height={height}
      eager={eager}
    />
  );
}

export default function ViandesDesSommets({
  loaderData,
}: Route.ComponentProps) {
  return (
    <VitrineMedia images={loaderData.images}>
      <main id="contenu" className="client-project">
        <article aria-labelledby="project-title">
          <h1 id="project-title" className="project-sr-only">
            Viandes des Sommets : une identité visuelle par EPICC
          </h1>
          <div className="project-hero">
            <ProjectImage
              name="ouverture"
              alt="Viandes des Sommets : café renversé et étiquettes de marque sur une table"
              width={1936}
              height={1464}
              eager
            />
          </div>
          <section className="project-logo" aria-labelledby="logo-title">
            <h2 id="logo-title" className="project-sr-only">
              Construction du logo et lettrage
            </h2>
            <div className="project-logo-grid">
              <ProjectImage
                name="construction-logo"
                alt="Construction géométrique du logo rouge Viandes des Sommets"
                width={1947}
                height={1095}
              />
            </div>
            <div className="project-lettering project-lettering-first">
              <ProjectImage
                name="lettrage"
                alt="Viandes, recherche de lettrage manuscrit"
                width={1280}
                height={377}
              />
            </div>
            <div className="project-lettering project-lettering-second">
              <ProjectImage
                name="lettrage"
                alt="Des Sommets, suite du lettrage manuscrit"
                width={1280}
                height={377}
              />
            </div>
            <p className="project-margin-note">
              Puis, j’ai continué mes armes chez Metro (on se rapproche de la
              restauration tout doucement...) en stratégie, puis sur la force de
              vente au contact direct des restaurateurs.
              <br />
              <br />
              J’ai rencontré des chefs, commencé à développer mon réseau.
            </p>
          </section>
          <section className="project-symbol" aria-labelledby="symbol-title">
            <h2 id="symbol-title" className="project-sr-only">
              Un symbole entre initiale et sommets
            </h2>
            <ProjectImage
              name="symbole"
              alt="Déclinaisons du logo : nom blanc sur fond rouge et initiale V évoquant les sommets"
              width={1919}
              height={1079}
            />
          </section>
          <section
            className="project-photography"
            aria-labelledby="photography-title"
          >
            <h2 id="photography-title" className="project-sr-only">
              L’univers photographique de la marque
            </h2>
            <figure className="project-photo project-photo-grill">
              <ProjectImage
                name="grillade"
                alt="Viande rôtie au-dessus des braises"
                width={422}
                height={631}
              />
            </figure>
            <figure className="project-photo project-photo-table">
              <ProjectImage
                name="table"
                alt="Préparation d’un repas autour d’une table en plein air"
                width={459}
                height={688}
              />
            </figure>
            <figure className="project-photo project-photo-mountain">
              <ProjectImage
                name="montagne"
                alt="Photographie de montagne de l’univers Viandes des Sommets"
                width={430}
                height={645}
              />
            </figure>
            <figure className="project-photo project-photo-products">
              <ProjectImage
                name="produits"
                alt="Produits Viandes des Sommets sur fond de paysage de montagne"
                width={391}
                height={586}
              />
            </figure>
            <figure className="project-photo project-photo-meeting">
              <ProjectImage
                name="rencontre"
                alt="Moment partagé sur des chaises longues dans la neige"
                width={440}
                height={645}
              />
            </figure>
          </section>
          <section
            className="project-applications"
            aria-labelledby="applications-title"
          >
            <h2 id="applications-title" className="project-sr-only">
              Packaging et supports de l’identité visuelle
            </h2>
            <div className="project-black-panel" aria-hidden="true" />
            <figure className="project-application project-cards">
              <ProjectImage
                name="packaging-cartes"
                alt="Cartes et packaging rouge et blanc Viandes des Sommets"
                width={534}
                height={329}
              />
            </figure>
            <figure className="project-application project-box">
              <ProjectImage
                name="coffret"
                alt="Coffret Viandes des Sommets avec carte illustrée"
                width={413}
                height={254}
              />
            </figure>
            <figure className="project-application project-bag">
              <ProjectImage
                name="sac"
                alt="Sac en toile avec anses rouges et logo Viandes des Sommets"
                width={578}
                height={578}
              />
            </figure>
            <div
              className="project-swatches"
              aria-label="Quatre échantillons gris de présentation"
            >
              <span />
              <span />
              <span />
              <span />
            </div>
            <figure className="project-application project-stamp">
              <ProjectImage
                name="tampon"
                alt="Tampon circulaire rouge de l’identité Viandes des Sommets"
                width={346}
                height={364}
              />
            </figure>
          </section>
          <div className="project-frieze">
            <ProjectImage
              name="frise"
              alt="Frise des logos Viandes des Sommets"
              width={2134}
              height={340}
            />
          </div>
          <footer className="project-footer">
            <nav aria-label="Fil d’Ariane">
              <Link to="/">EPICC</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">Viandes des Sommets</span>
            </nav>
            <h2>Viandes des Sommets</h2>
            <p>
              Identité visuelle, construction du logo et déclinaisons de marque
              : un projet à découvrir à travers son univers photographique et
              ses supports imprimés.
            </p>
            <Link to="/#projets">← Tous les projets</Link>
            <Link to="/#contact">Parlons de votre identité visuelle ↗</Link>
          </footer>
        </article>
      </main>
    </VitrineMedia>
  );
}
