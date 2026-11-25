import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import { Fragment, type ReactNode } from 'react';
import sharp from 'sharp';
import {
  VitrineMedia,
  type VitrineImage,
} from '../apps/web/app/components/vitrine/media';
import Amafolia from '../apps/web/app/routes/amafolia';
import Home from '../apps/web/app/routes/home';
import ViandesDesSommets from '../apps/web/app/routes/viandes-des-sommets';
import {
  homeDescription,
  homeStructuredData,
  homeTitle,
} from '../apps/web/app/services/seo';
import {
  amafolia,
  getContactEmail,
  getPublicSiteUrl,
  projectStructuredData,
  viandesDesSommets,
} from '../apps/web/app/site';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicFiles = join(root, 'apps/web/public');
const dist = join(root, 'dist');
const output = join(dist, 'site');
const { origin, pathname } = getPublicSiteUrl() ?? { origin: '', pathname: '' };
const basePath = pathname.replace(/\/+$/, '');
const baseUrl = origin + basePath;
const homePath = `${basePath}/`;
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
  const path = `/assets/${name}-${hash}.${extension}`;
  await writeFile(join(output, path), content);
  return basePath + path;
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
    external: ['../fonts/*'],
  });
  return writeAsset(name, 'css', result.outputFiles[0]!.contents);
}

const clientProjects = [
  { metadata: amafolia, content: <Amafolia homePath={homePath} /> },
  {
    metadata: viandesDesSommets,
    content: <ViandesDesSommets homePath={homePath} />,
  },
];

async function browserScript(name: string, entry: string) {
  const result = await build({
    entryPoints: [join(root, 'apps/web/app', entry)],
    bundle: true,
    minify: true,
    target: 'es2022',
    write: false,
  });
  return writeAsset(name, 'js', result.outputFiles[0]!.contents);
}

function filmUrl(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Les vidéos de la vitrine exigent une URL HTTPS publique.');
  }
  return url.href;
}

const films = {
  signature: filmUrl(process.env.VITRINE_SIGNATURE_VIDEO_URL),
  portrait: filmUrl(process.env.VITRINE_PORTRAIT_VIDEO_URL),
};
const [homeCss, projectCss, script, filmScript] = await Promise.all([
  stylesheet('accueil', 'vitrine'),
  stylesheet('projet', 'client-project'),
  browserScript('vitrine', 'enhancements.ts'),
  films.signature || films.portrait
    ? browserScript('films', 'vitrine-films.ts')
    : undefined,
]);

const home = <Home email={email} basePath={basePath} films={films} />;
const icon = await writeAsset(
  'epicc-icone',
  'png',
  await readFile(join(publicFiles, 'images/vitrine/epicc-icone.png')),
);
const requestedImages = new Map<string, number>();
const homeCover = {
  file: 'OpeningSignature.png',
  alt: 'Chloé signe la vitrine d’un restaurant.',
};
const covers = [
  homeCover.file,
  ...clientProjects.map(({ metadata }) => metadata.cover.file),
];
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
    {clientProjects.map(({ metadata, content }) => (
      <Fragment key={metadata.path}>{content}</Fragment>
    ))}
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
  supplementaryScript?: string;
  cover?: { file: string; alt: string };
  structuredData?: object;
  content: ReactNode;
};

function renderPage({
  path,
  title,
  description,
  css,
  supplementaryScript,
  cover,
  structuredData,
  content,
}: Page) {
  const url = baseUrl && path !== '/404.html' ? baseUrl + path : null;
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
          <link rel="icon" href={icon} type="image/png" sizes="64x64" />
          <link rel="stylesheet" href={css} />
          <script type="module" src={script} />
          {supplementaryScript && (
            <script type="module" src={supplementaryScript} />
          )}
        </head>
        <body>
          <a className="skip-link" href="#contenu">
            Aller au contenu
          </a>
          <VitrineMedia resolve={imageFor}>{content}</VitrineMedia>
          <img
            className="epicc-pointer-logo"
            src={icon}
            alt=""
            width={40}
            height={40}
          />
        </body>
      </html>,
    )
  );
}

await writeFile(
  join(output, 'index.html'),
  renderPage({
    path: '/',
    title: homeTitle,
    description: homeDescription,
    css: homeCss,
    content: home,
    ...(filmScript && { supplementaryScript: filmScript }),
    cover: homeCover,
    ...(baseUrl && { structuredData: homeStructuredData(baseUrl) }),
  }),
);
for (const { metadata, content } of clientProjects) {
  const directory = join(output, metadata.path);
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, 'index.html'),
    renderPage({
      ...metadata,
      css: projectCss,
      content,
      ...(baseUrl && {
        structuredData: projectStructuredData(
          baseUrl,
          origin + imageFor(metadata.cover.file).image,
          metadata,
        ),
      }),
    }),
  );
}
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
        <a href={homePath}>Revenir à l’accueil</a>
      </main>
    ),
  }),
);

await writeFile(
  join(output, 'robots.txt'),
  `User-agent: *\nAllow: /\n${baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml\n` : ''}`,
);
if (baseUrl) {
  const paths = ['/', ...clientProjects.map(({ metadata }) => metadata.path)];
  const urls = paths
    .map((path) => `<url><loc>${baseUrl}${path}</loc></url>`)
    .join('');
  await writeFile(
    join(output, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`,
  );
}

await cp(join(root, 'tools/serve-site.mjs'), join(dist, 'serve.mjs'));
await mkdir(join(dist, 'apps/api'), { recursive: true });
await writeFile(join(dist, 'apps/api/main.mjs'), "import '../../serve.mjs';\n");
console.log(
  `Vitrine générée dans dist/site : ${images.size} visuels optimisés.`,
);
