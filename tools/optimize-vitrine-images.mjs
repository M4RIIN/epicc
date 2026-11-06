import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(
  new URL('../apps/web/public/images/vitrine/', import.meta.url),
);
const output = fileURLToPath(
  new URL('../apps/web/public/images/optimized/v1/', import.meta.url),
);
const manifestFile = fileURLToPath(
  new URL(
    '../apps/web/app/components/vitrine/image-manifest.generated.json',
    import.meta.url,
  ),
);
const widths = [320, 640, 1280, 1920];
const recipe = 'webp-88-alpha100-auto-orient-v1';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function atomicWrite(file, bytes) {
  const temporary = `${file}.tmp-${process.pid}`;
  await writeFile(temporary, bytes);
  await rename(temporary, file);
}
let previous = {};
try {
  previous = JSON.parse(await readFile(manifestFile, 'utf8'));
} catch {
  /* Première compilation. */
}
await mkdir(output, { recursive: true });
const manifest = {};
let originalBytes = 0;
let responsiveBytes = 0;
for (const file of (await readdir(root)).sort()) {
  if (!/\.(png|jpe?g|webp|avif)$/i.test(file)) continue;
  const bytes = await readFile(`${root}/${file}`);
  originalBytes += bytes.length;
  const signature = digest(Buffer.concat([Buffer.from(recipe), bytes]));
  const existing = previous[file];
  if (
    existing?.signature === signature &&
    (
      await Promise.all(
        existing.candidates.map(async (item) => {
          try {
            return (
              (await stat(`${output}/${item.src.split('/').at(-1)}`)).size > 0
            );
          } catch {
            return false;
          }
        }),
      )
    ).every(Boolean)
  ) {
    manifest[file] = existing;
  } else {
    const metadata = await sharp(bytes).metadata();
    const sourceWidth = metadata.autoOrient.width;
    const candidates = [];
    for (const width of [
      ...new Set(widths.map((width) => Math.min(width, sourceWidth))),
    ]) {
      const { data, info } = await sharp(bytes)
        .autoOrient()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 88, alphaQuality: 100, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      const name = `${file}.${digest(data).slice(0, 16)}.${info.width}.webp`;
      await atomicWrite(`${output}/${name}`, data);
      candidates.push({
        width: info.width,
        src: `/images/optimized/v1/${name}`,
        bytes: data.length,
      });
    }
    manifest[file] = { signature, candidates };
  }
  const candidates = manifest[file].candidates;
  responsiveBytes += (
    candidates.find((item) => item.width >= 640) ?? candidates.at(-1)
  ).bytes;
}
const json = `${JSON.stringify(manifest, null, 2)}\n`;
if (JSON.stringify(previous) !== JSON.stringify(manifest))
  await atomicWrite(manifestFile, json);
console.info(
  `Vitrine : ${Object.keys(manifest).length} images ; originaux ${(originalBytes / 1048576).toFixed(2)} Mo ; versions jusqu’à 640 px ${(responsiveBytes / 1048576).toFixed(2)} Mo.`,
);
