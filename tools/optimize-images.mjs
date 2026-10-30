import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import { optimize } from 'svgo';
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { basename, extname } from 'node:path';

const source = fileURLToPath(
  new URL('../apps/web/public/images/vitrine/', import.meta.url),
);
const output = `${source}/optimized`;
const manifest = fileURLToPath(
  new URL(
    '../apps/web/app/components/vitrine/images.generated.ts',
    import.meta.url,
  ),
);
const illustrations = [
  [657.1, 430.75, 114.082, 94.5973],
  [750.8, 433.55, 129.721, 96.1133],
  [839.89, 540.82, 111.876, 138.255],
  [696.66, 596.5, 106.096, 83.3152],
  [556.28, 523.59, 129.497, 63.2699],
  [701.29, 497.44, 105.773, 80.3355],
  [735.24, 809.34, 129.713, 94.7622],
  [590.19, 594.76, 116.048, 74.4749],
  [829, 777.32, 78.912, 54.1887],
  [867.6, 708.62, 70.4246, 64.3214],
  [614.91, 725.62, 111.941, 138.113],
  [705.66, 715.8, 129.512, 63.2597],
  [681.87, 831.44, 76.734, 100.787],
  [610.84, 674.52, 71.6343, 54.6558],
  [518.32, 647.32, 111.873, 138.185],
  [905.34, 679.64, 77.0141, 172.773],
  [779.72, 642.43, 105.781, 80.3356],
];
// Une seule couche transparente, pour éviter les 17 téléchargements de dessins successifs.
const drawings = await Promise.all(
  illustrations.map(async ([x, y, width, height], index) => {
    const original = await readFile(
      `${source}/Group${index || ''}.svg`,
      'utf8',
    );
    const svg = optimize(original, {
      plugins: [{ name: 'prefixIds', params: { prefix: `drawing-${index}` } }],
    }).data;
    const data = Buffer.from(svg).toString('base64');
    return `<image href="data:image/svg+xml;base64,${data}" width="${width}" height="${height}" transform="translate(${x} ${y}) rotate(4.56) skewX(3.64)"/>`;
  }),
);
const rectangle = (await readFile(`${source}/Rectangle.png`)).toString(
  'base64',
);
const collage = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1395" viewBox="0 0 1920 1395"><g opacity="0.5">${drawings.join('')}<image href="data:image/png;base64,${rectangle}" width="96.33" height="108.08" transform="translate(661.69 397.35) rotate(4.58) skewX(3.66)"/></g></svg>`,
);
// Les SVG imbriqués restent des images indépendantes : leurs références internes ne se croisent pas.
const entries = (await readdir(source)).filter((file) =>
  /\.(png|jpg)$/.test(file),
);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const images = {};
let originalBytes = 0;
let optimizedBytes = 0;
for (const file of [...entries, 'opening-collage']) {
  const input =
    file === 'opening-collage' ? collage : await readFile(`${source}/${file}`);
  const metadata = await sharp(input).metadata();
  const maxWidth = file === 'opening-collage' ? 2880 : metadata.width;
  const widths = [
    ...new Set([Math.min(480, maxWidth), Math.min(960, maxWidth), maxWidth]),
  ].sort((a, b) => a - b);
  const variants = [];
  for (const width of widths) {
    const buffer = await sharp(
      input,
      file === 'opening-collage' ? { density: (width / 1920) * 72 } : {},
    )
      .resize({ width, withoutEnlargement: file !== 'opening-collage' })
      .webp({ quality: 85, alphaQuality: 100, effort: 6 })
      .toBuffer();
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12);
    const name = `${basename(file, extname(file))}-${width}.${hash}.webp`;
    await writeFile(`${output}/${name}`, buffer);
    variants.push({
      src: `/images/vitrine/optimized/${name}`,
      width,
      bytes: buffer.length,
    });
  }
  const largest = variants.at(-1);
  images[file] = {
    src: largest.src,
    srcSet: variants
      .map((variant) => `${variant.src} ${variant.width}w`)
      .join(', '),
  };
  originalBytes +=
    file === 'opening-collage'
      ? (
          await Promise.all(
            illustrations.map((_, index) =>
              readFile(`${source}/Group${index || ''}.svg`),
            ),
          )
        ).reduce((sum, buffer) => sum + buffer.length, 0)
      : input.length;
  optimizedBytes += largest.bytes;
}
await writeFile(
  manifest,
  `// Généré par npm run images:optimize ; modifier les sources, puis relancer la commande.\nexport const optimizedImages = ${JSON.stringify(images, null, 2)} as const;\n`,
);
console.info(
  `Visuels optimisés : ${Math.round(originalBytes / 1024)} Ko → ${Math.round(optimizedBytes / 1024)} Ko (variantes les plus grandes).`,
);
