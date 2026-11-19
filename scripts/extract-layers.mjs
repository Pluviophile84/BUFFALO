#!/usr/bin/env node
// Extract the locked master emblem into web-ready layers.
// Rules: extract, place, scale only. No redraw, no recolor (except the two
// sanctioned Ƀ fill recolors), no sharpening, no resampling above native size.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { optimize } from 'svgo';
import { ROOT, BRAND_DIR, LAYERS_DIR, parseMaster, placeInMaster, parseBTransform, bakePath } from './lib/master.mjs';

const VB = '40 40 920 920';
const COLORS = { cream: '#EEE1C6', ink: '#1B1510', bronze: '#947342' };
const BISON_WIDTHS = [480, 768, 1023];

fs.mkdirSync(BRAND_DIR, { recursive: true });
fs.mkdirSync(LAYERS_DIR, { recursive: true });
const m = parseMaster();
const written = [];
// Served layers go to BRAND_DIR (fingerprinted by the site build); renders used
// only for verification (and as the kit's sources) go to LAYERS_DIR.
const write = (name, buf, dir = BRAND_DIR) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, buf);
  written.push(file);
  return file;
};

// SVGO with tuned precision. 0.1 user units = 0.1px at a 1000px render, far below
// visible tolerance; colors and fills are left exactly as authored.
const svgoOpts = (precision) => ({
  multipass: true,
  floatPrecision: precision,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertColors: false,
          convertPathData: { floatPrecision: precision, transformPrecision: 5 },
          cleanupNumericValues: { floatPrecision: precision },
          convertShapeToPath: false,
          mergePaths: false,
          cleanupIds: false,
        },
      },
    },
  ],
});

// 1. frame.svg — #frame only, in the master viewBox.
const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}"><g id="frame">${m.frameInner}</g></svg>`;
write('frame.svg', optimize(frameSvg, svgoOpts(1)).data, LAYERS_DIR);

// 1b. guilloche.svg — the frame's line work only, so the coin can be layered
// (rings render as three inline circles beneath it; together they equal #frame).
// The group carries id="guilloche" so pages can reference it with <use href="…#guilloche">.
const guillocheSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}">${m.guillocheGroup.replace('<g fill="none"', '<g id="guilloche" fill="none"')}</svg>`;
write('guilloche.svg', optimize(guillocheSvg, svgoOpts(1)).data);

// 2. b-symbol*.svg — Ƀ with its transform baked in and a tight, computed viewBox.
const bt = parseBTransform(m.bTransform);
const baked = bakePath(m.bPath.d, bt.apply, 3);
const { minX, minY, maxX, maxY } = baked.bbox;
const pad = 0; // tight
const bvb = [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad].map((n) => Number(n.toFixed(3)));
const bSvg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bvb.join(' ')}" width="${bvb[2]}" height="${bvb[3]}"><path fill="${fill}" fill-rule="${m.bPath.fillRule}" d="${baked.d}"/></svg>\n`;
write('b-symbol.svg', bSvg(COLORS.cream), LAYERS_DIR);
write('b-symbol-ink.svg', bSvg(COLORS.ink), LAYERS_DIR);
write('b-symbol-bronze.svg', bSvg(COLORS.bronze), LAYERS_DIR);

// 3. Bison — lossless decode, then responsive AVIF/WebP at or below native width.
if (m.bison.mime !== 'image/png') throw new Error('bison-raster is not PNG');
const bisonMeta = await sharp(m.bison.data).metadata();
if (bisonMeta.width !== m.bison.width || bisonMeta.height !== m.bison.height) {
  throw new Error('bison-raster native size differs from its placement box; aspect logic would be required');
}
write('bison.png', m.bison.data, LAYERS_DIR); // byte-identical to the embedded raster
const bisonSet = [];
for (const w of BISON_WIDTHS) {
  if (w > bisonMeta.width) throw new Error('Refusing to resample above native size');
  const base = sharp(m.bison.data, { failOn: 'error' });
  const pipe = w === bisonMeta.width ? base : base.resize({ width: w, kernel: 'lanczos3' });
  const avif = await pipe.clone().avif({ quality: 64, effort: 7, chromaSubsampling: '4:4:4' }).toBuffer();
  const webp = await pipe.clone().webp({ quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
  write(`bison-${w}.avif`, avif);
  write(`bison-${w}.webp`, webp);
  bisonSet.push({ width: w, height: Math.round((w * bisonMeta.height) / bisonMeta.width) });
}

// 4. Ground — lossless PNG (byte-identical) + lossless WebP.
const groundMeta = await sharp(m.ground.data).metadata();
write('ground.png', m.ground.data, LAYERS_DIR);
write('ground.webp', await sharp(m.ground.data).webp({ lossless: true, effort: 6 }).toBuffer());

// 5. Geometry for the layered coin: every placement in master user space.
const bisonBox = placeInMaster(m.registered, m.bison);
const groundBox = placeInMaster(m.registered, m.ground);
const pct = (box) => ({
  left: ((box.x - 40) / 920) * 100,
  top: ((box.y - 40) / 920) * 100,
  width: (box.width / 920) * 100,
  height: (box.height / 920) * 100,
});

const brand = {
  source: 'assets/source/BUFFALO_Master_EdgeToEdge.svg',
  viewBox: VB,
  circles: m.circles,
  guillocheStroke: { stroke: '#5E634A', width: 1.1 },
  registeredMatrix: m.registered.matrix,
  bison: { native: { width: bisonMeta.width, height: bisonMeta.height }, master: bisonBox, percent: pct(bisonBox), srcset: bisonSet },
  ground: { native: { width: groundMeta.width, height: groundMeta.height }, master: groundBox, percent: pct(groundBox) },
  b: {
    transform: m.bTransform,
    d: m.bPath.d,
    fill: m.bPath.fill,
    fillRule: m.bPath.fillRule,
    baked: { d: baked.d, viewBox: bvb.join(' ') },
  },
};

const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const files = {};
for (const file of written.sort((a, b) => path.basename(a).localeCompare(path.basename(b)))) {
  const name = path.basename(file);
  const buf = fs.readFileSync(file);
  const meta = /\.(png|webp|avif)$/.test(name) ? await sharp(buf).metadata() : null;
  files[name] = { bytes: buf.length, sha256: hash(buf), ...(meta ? { width: meta.width, height: meta.height } : {}) };
}
const manifest = {
  generatedBy: 'scripts/extract-layers.mjs',
  masterSha256: hash(fs.readFileSync(path.join(ROOT, brand.source))),
  files,
  geometry: brand,
};
fs.writeFileSync(path.join(LAYERS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/brand.json'), JSON.stringify(brand, null, 2) + '\n');

for (const [n, f] of Object.entries(files)) console.log(`  ${n.padEnd(24)} ${String(f.bytes).padStart(9)} B${f.width ? `  ${f.width}×${f.height}` : ''}`);
console.log('extract-layers: done');

// 6. Coin geometry as CSS (the CSP forbids inline style attributes).
const gpct = (n) => `${n.toFixed(5)}%`;
const bp = brand.bison.percent;
const gp = brand.ground.percent;
fs.writeFileSync(
  path.join(ROOT, 'src/styles/coin-geometry.css'),
  `/* Generated by scripts/extract-layers.mjs from the master — do not edit. */
/* Layer "emblem" is last in the cascade: no section rule can move a layer. */
@layer emblem {
  .coin { position: relative; aspect-ratio: 1; isolation: isolate; }
  .coin > * { position: absolute; margin: 0; padding: 0; max-width: none; }
  .coin > .coin__layer { inset: 0; width: 100%; height: 100%; }
  .coin > .coin__bison { display: block; left: ${gpct(bp.left)}; top: ${gpct(bp.top)}; width: ${gpct(bp.width)}; height: ${gpct(bp.height)}; }
  .coin > .coin__bison > img { display: block; width: 100%; height: 100%; max-width: none; }
  .coin > .coin__ground { display: block; left: ${gpct(gp.left)}; top: ${gpct(gp.top)}; width: ${gpct(gp.width)}; height: ${gpct(gp.height)}; }
}
`,
);
console.log('  src/styles/coin-geometry.css');
