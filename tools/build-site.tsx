import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import sharp from 'sharp';
import {
  VitrineMedia,
  type VitrineImage,
} from '../apps/web/app/components/vitrine/media';
import Home from '../apps/web/app/routes/home';
import ViandesDesSommets from '../apps/web/app/routes/viandes-des-sommets';
import {
  homeDescription,
  homeStructuredData,
  homeTitle,
} from '../apps/web/app/services/seo';
import {
  getContactEmail,
  getPublicOrigin,
  projectDescription,
  projectPath,
  projectStructuredData,
  projectTitle,
} from '../apps/web/app/site';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicFiles = join(root, 'apps/web/public');
const dist = join(root, 'dist');
const output = join(dist, 'site');
const origin = getPublicOrigin();
const email = getContactEmail();

await rm(dist, { recursive: true, force: true });
await mkdir(join(output, 'assets'), { recursive: true });
await cp(join(publicFiles, 'fonts'), join(output, 'fonts'), {
  recursive: true,
});

async function writeAsset(
  name: string,
  extension: string,
  content: Uint8Array,
) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const url = `/assets/${name}-${hash}.${extension}`;
  await writeFile(join(output, url), content);
  return url;
}

async function stylesheet(name: string, specific: string) {
  const result = await build({
    stdin: {
      contents: `@import './styles.css'; @import './components/vitrine/${specific}.css';`,
      loader: 'css',
      resolveDir: join(root, 'apps/web/app'),
    },
    bundle: true,
    minify: true,
    write: false,
    external: ['/fonts/*'],
  });
  return writeAsset(name, 'css', result.outputFiles[0]!.contents);
}

const [homeCss, projectCss, script] = await Promise.all([
  stylesheet('accueil', 'vitrine'),
  stylesheet('projet', 'client-project'),
  build({
    entryPoints: [join(root, 'apps/web/app/enhancements.ts')],
    bundle: true,
    minify: true,
    target: 'es2022',
    write: false,
  }).then((result) =>
    writeAsset('vitrine', 'js', result.outputFiles[0]!.contents),
  ),
]);

const home = <Home email={email} />;
const project = <ViandesDesSommets />;
const requestedImages = new Map<string, number>();
const covers = ['OpeningSignature.png', 'viandes-des-sommets/ouverture.webp'];
// Les composants déclarent eux-mêmes les fichiers utilisés par les deux pages.
renderToStaticMarkup(
  <VitrineMedia
    resolve={(file, width = 0) => {
      requestedImages.set(
        file,
        Math.max(width, requestedImages.get(file) ?? 0),
      );
      return { image: 'data:,' };
    }}
  >
    {home}
    {project}
  </VitrineMedia>,
);

async function optimizeImage(
  file: string,
  displayWidth: number,
): Promise<VitrineImage> {
  const source = join(
    publicFiles,
    'images',
    file.includes('/') ? file : `vitrine/${file}`,
  );
  const name = parse(file).name.toLowerCase();
  if (file.endsWith('.svg')) {
    return { image: await writeAsset(name, 'svg', await readFile(source)) };
  }
  const image = sharp(source);
  const metadata = await image.metadata();
  const maximum = Math.min(
    metadata.width,
    1920,
    Math.max(640, Math.ceil(displayWidth * 2)),
  );
  const widths = [320, 640, 960, 1280]
    .filter((width) => width <= maximum * 0.9)
    .concat(maximum);
  const sources = [];
  for (const width of widths) {
    const content = await image
      .clone()
      .resize({ width })
      .webp({ quality: 85, alphaQuality: 100, effort: 4 })
      .toBuffer();
    sources.push({
      width,
      src: await writeAsset(`${name}-${width}`, 'webp', content),
    });
  }
  const best = covers.includes(file)
    ? sources.at(-1)!
    : (sources.find(({ width }) => width >= displayWidth) ?? sources.at(-1)!);
  return { image: best.src, sources };
}

const images = new Map<string, VitrineImage>();
for (const [file, width] of requestedImages)
  images.set(file, await optimizeImage(file, width));
function imageFor(file: string) {
  const image = images.get(file);
  if (!image) throw new Error(`Visuel introuvable : ${file}`);
  return image;
}

type Page = {
  path: string;
  title: string;
  description: string;
  css: string;
  cover?: { file: string; alt: string };
  structuredData?: object;
  script?: string;
  content: ReactNode;
};

function renderPage({
  path,
  title,
  description,
  css,
  cover,
  structuredData,
  script,
  content,
}: Page) {
  const url = origin && path !== '/404.html' ? origin + path : null;
  const image = origin && cover && origin + imageFor(cover.file).image;
  return (
    '<!doctype html>\n' +
    renderToStaticMarkup(
      <html lang="fr">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="EPICC" />
          <meta property="og:locale" content="fr_FR" />
          <meta
            name="twitter:card"
            content={image ? 'summary_large_image' : 'summary'}
          />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          {url && <link rel="canonical" href={url} />}
          {url && <meta property="og:url" content={url} />}
          {image && cover && (
            <>
              <meta property="og:image" content={image} />
              <meta property="og:image:alt" content={cover.alt} />
              <meta name="twitter:image" content={image} />
            </>
          )}
          {structuredData && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData).replaceAll(
                  '<',
                  '\\u003c',
                ),
              }}
            />
          )}
          {path === '/404.html' && <meta name="robots" content="noindex" />}
          <link rel="stylesheet" href={css} />
          {script && <script type="module" src={script} />}
        </head>
        <body>
          <a className="skip-link" href="#contenu">
            Aller au contenu
          </a>
          <VitrineMedia resolve={imageFor}>{content}</VitrineMedia>
        </body>
      </html>,
    )
  );
}

await mkdir(join(output, projectPath), { recursive: true });
await writeFile(
  join(output, 'index.html'),
  renderPage({
    path: '/',
    title: homeTitle,
    description: homeDescription,
    css: homeCss,
    script,
    content: home,
    cover: { file: covers[0]!, alt: 'Chloé signe la vitrine d’un restaurant.' },
    ...(origin && { structuredData: homeStructuredData(origin) }),
  }),
);
await writeFile(
  join(output, projectPath, 'index.html'),
  renderPage({
    path: projectPath,
    title: projectTitle,
    description: projectDescription,
    css: projectCss,
    content: project,
    cover: { file: covers[1]!, alt: 'Univers de marque Viandes des Sommets' },
    ...(origin && {
      structuredData: projectStructuredData(
        origin,
        origin + imageFor(covers[1]!).image,
      ),
    }),
  }),
);
await writeFile(
  join(output, '404.html'),
  renderPage({
    path: '/404.html',
    title: 'Page introuvable | EPICC',
    description: 'La page demandée est introuvable.',
    css: homeCss,
    content: (
      <main id="contenu" className="error-page">
        <h1>Page introuvable</h1>
        <a href="/">Revenir à l’accueil</a>
      </main>
    ),
  }),
);

await writeFile(
  join(output, 'robots.txt'),
  `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`,
);
if (origin) {
  await writeFile(
    join(output, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}${projectPath}</loc></url></urlset>\n`,
  );
}

await cp(join(root, 'tools/serve-site.mjs'), join(dist, 'serve.mjs'));
// Entrée de compatibilité pour les aperçus déjà configurés.
await mkdir(join(dist, 'apps/api'), { recursive: true });
await writeFile(join(dist, 'apps/api/main.mjs'), "import '../../serve.mjs';\n");
console.log(
  `Vitrine générée dans dist/site : ${images.size} visuels optimisés.`,
);
