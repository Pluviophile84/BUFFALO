#!/usr/bin/env node
// Historical plates. Rules (§11.4): no recoloring, no aging, no repainting, never
// upscale. Coin photos are cut out onto their plates with a lossless circular
// alpha mask: only alpha is written, RGB pixels are untouched.
// If an upgraded source is missing, the vetted baseline is used instead.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib/master.mjs';

const SRC = path.join(ROOT, 'assets/historical');
const OUT = path.join(ROOT, 'src/assets/history');
fs.mkdirSync(OUT, { recursive: true });

const PLATES = [
  { id: 'note-1901', sources: ['bison-note-1901.webp'], widths: [480, 720, 960], cutout: false },
  { id: 'nickel-1913', sources: ['buffalo-nickel-optimized.webp'], widths: [450, 675, 900], cutout: true },
  {
    id: 'gold-2006',
    // Upgraded: Wikimedia Commons, PD-USGov-money (see ASSET-SOURCES.md). Baseline second.
    sources: ['2006_American_Buffalo_Proof_Reverse-1280px.jpg', 'gold-buffalo-optimized.webp'],
    widths: [640, 960, 1280],
    cutout: true,
  },
];

/** Circle from the bounding box of non-paper pixels (white background). */
async function detectCircle(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 245) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2, r: Math.min(x1 - x0 + 1, y1 - y0 + 1) / 2 };
}

const report = {};
for (const plate of PLATES) {
  const file = plate.sources.find((s) => fs.existsSync(path.join(SRC, s)));
  if (!file) throw new Error(`No source (upgrade or baseline) for ${plate.id}`);
  let buf = fs.readFileSync(path.join(SRC, file));
  const meta = await sharp(buf).metadata();

  if (plate.cutout && !meta.hasAlpha) {
    const { cx, cy, r } = await detectCircle(buf);
    // Inset 1px so no paper-white fringe survives; edge is anti-aliased by the rasterizer.
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}"><circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="#fff"/></svg>`,
    );
    const alpha = await sharp(mask).extractChannel(3).raw().toBuffer();
    const rgb = await sharp(buf).removeAlpha().raw().toBuffer();
    const n = meta.width * meta.height;
    const rgba = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
      // RGB copied byte-for-byte; only alpha is written.
      rgba[i * 4] = rgb[i * 3];
      rgba[i * 4 + 1] = rgb[i * 3 + 1];
      rgba[i * 4 + 2] = rgb[i * 3 + 2];
      rgba[i * 4 + 3] = alpha[i];
    }
    buf = await sharp(rgba, { raw: { width: meta.width, height: meta.height, channels: 4 } }).png().toBuffer();
  }

  const widths = plate.widths.filter((w) => w <= meta.width);
  if (!widths.includes(meta.width) && widths.length < plate.widths.length) widths.push(meta.width);
  const out = [];
  for (const w of widths) {
    const pipe = w === meta.width ? sharp(buf) : sharp(buf).resize({ width: w, kernel: 'lanczos3' });
    const h = Math.round((w * meta.height) / meta.width);
    const avif = await pipe.clone().avif({ quality: 62, effort: 6 }).toBuffer();
    const webp = await pipe.clone().webp({ quality: 82, alphaQuality: 100, effort: 6 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${plate.id}-${w}.avif`), avif);
    fs.writeFileSync(path.join(OUT, `${plate.id}-${w}.webp`), webp);
    out.push({ width: w, height: h, avif: avif.length, webp: webp.length });
  }
  report[plate.id] = { source: file, original: { width: meta.width, height: meta.height }, cutout: plate.cutout, sizes: out };
  console.log(`  ${plate.id.padEnd(12)} from ${file} (${meta.width}×${meta.height}) → ${out.map((o) => `${o.width}w`).join(', ')}`);
}
fs.writeFileSync(path.join(ROOT, 'src/data/history.json'), JSON.stringify(report, null, 2) + '\n');
console.log('build-historical: done');
