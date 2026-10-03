// Builds the web art pack (art/web/v01) from the preserved PNG originals.
// The originals stay untouched; the game and the Pages build load these WebP copies.
import sharp from 'sharp';
import { mkdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('art/production/v01');
const target = resolve('art/web/v01');
const manifest = JSON.parse(readFileSync(resolve(source, 'manifest.json'), 'utf8'));
// Widths keep full-screen scenes sharp on phones while cutting each file to a fraction of the PNG.
const widthFor = path => path.startsWith('items/') ? 512 : path.startsWith('characters/') ? 720 : path.startsWith('puzzles/') ? 960 : 1145;
const force = process.argv.includes('--force');
let written = 0, skipped = 0, before = 0, after = 0;
for (const asset of manifest.assets) {
  if (!asset.path?.endsWith('.png')) continue;
  const input = resolve(source, asset.path);
  const output = resolve(target, asset.path.replace(/\.png$/, '.webp'));
  before += statSync(input).size;
  if (!force && existsSync(output) && statSync(output).mtimeMs >= statSync(input).mtimeMs) { skipped++; after += statSync(output).size; continue; }
  mkdirSync(dirname(output), { recursive: true });
  await sharp(input).resize({ width: widthFor(asset.path), withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(output);
  after += statSync(output).size;
  written++;
}
const mb = n => (n / 1048576).toFixed(1) + 'MB';
console.log(`WebP pack: ${written} written, ${skipped} unchanged · ${mb(before)} → ${mb(after)}`);
