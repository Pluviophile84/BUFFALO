#!/usr/bin/env node
// The Custodian Kit + favicons. Logo-pack files are preferred; only what the
// pack lacks is generated, always from the master. Emblem exports are edge to
// edge (rim touches all four canvas edges; transparent outside the circle).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, PACK_DIR, LAYERS_DIR } from './lib/master.mjs';
import { renderSvg, renderMaster, fieldPaths } from './lib/render.mjs';

// src/assets/kit: the site build fingerprints every file (/_astro/…); kit.json names
// them relative to this folder and the page resolves the URLs (src/lib/assets.ts).
const KIT = path.join(ROOT, 'src/assets/kit');
const PREV = path.join(KIT, 'previews');
const PUB = path.join(ROOT, 'public');
fs.mkdirSync(PREV, { recursive: true });

const VAULT = '#0E100B';
const pack = (rel) => path.join(PACK_DIR, rel);
const kb = (f) => `${Math.round(fs.statSync(f).size / 1024)} KB`;
const log = [];

// ── Emblem PNGs ───────────────────────────────────────────────────────────────
const emblem = {};
for (const size of [512, 1024, 2048]) {
  const out = path.join(KIT, `buffalo-emblem-${size}.png`);
  const packFile = pack(`02_Transparent_PNG/BUFFALO_Transparent_${size}.png`);
  if (fs.existsSync(packFile)) {
    fs.copyFileSync(packFile, out);
    log.push(`emblem ${size}: logo pack (02_Transparent_PNG)`);
  } else {
    // Not in the pack: render from the master. Above ~1218px the embedded bison
    // raster is interpolated (see README).
    fs.writeFileSync(out, await sharp(renderMaster(size)).png({ compressionLevel: 9 }).toBuffer());
    log.push(`emblem ${size}: generated from master`);
  }
  emblem[size] = out;
}

// ── Ƀ: SVG (extracted) + PNG in cream, bison-deep, bronze ───────────────────
const bVariants = [
  { id: 'cream', file: 'b-symbol.svg', label: 'Cream' },
  { id: 'ink', file: 'b-symbol-ink.svg', label: 'Bison deep' },
  { id: 'bronze', file: 'b-symbol-bronze.svg', label: 'Bronze' },
];
for (const v of bVariants) {
  const svg = fs.readFileSync(path.join(LAYERS_DIR, v.file), 'utf8');
  fs.writeFileSync(path.join(KIT, `buffalo-b-${v.id}.svg`), svg);
  const png = await renderSvg(svg, { width: 854 }); // 854 × 1000
  fs.writeFileSync(path.join(KIT, `buffalo-b-${v.id}.png`), png);
}
const bMeta = await sharp(path.join(KIT, 'buffalo-b-cream.png')).metadata();

// ── Composites: guilloche field + whole emblem (master render, never cropped) ─
// opacity per file: calibrated to the generated field's measured luminance in that file
async function composite({ width, height, emblemSize, ex, ey, opacity, text }) {
  const R = emblemSize / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${VAULT}"/>` +
    fieldPaths({ R, cx: ex + R, cy: ey + R, width, height, stroke: Math.max(1, emblemSize / 560), opacity }) +
    (text ?? '') +
    `</svg>`;
  const bg = await renderSvg(svg);
  const em = renderMaster(emblemSize);
  return sharp(bg).composite([{ input: em, left: Math.round(ex), top: Math.round(ey) }]).png({ compressionLevel: 9 }).toBuffer();
}

const xh = { width: 1500, height: 500, emblemSize: 400 };
xh.ex = xh.width - xh.emblemSize - 110;
xh.ey = (xh.height - xh.emblemSize) / 2;
fs.writeFileSync(
  path.join(KIT, 'buffalo-x-header-1500x500.png'),
  await composite({
    ...xh,
    opacity: 0.954,
    text: `<rect x="${xh.ex - 196}" y="234" width="160" height="32" fill="${VAULT}"/><text x="${xh.ex - 52}" y="255" text-anchor="end" font-family="JetBrains Mono" font-size="15" letter-spacing="4.2" fill="#9A937F">BUFFALO</text>`,
  }),
);
const phone = { width: 1290, height: 2796, emblemSize: 780 };
fs.writeFileSync(
  path.join(KIT, 'buffalo-wallpaper-phone-1290x2796.png'),
  await composite({ ...phone, ex: (phone.width - phone.emblemSize) / 2, ey: (phone.height - phone.emblemSize) / 2, opacity: 0.954 }),
);
const desk = { width: 2560, height: 1440, emblemSize: 720 };
fs.writeFileSync(
  path.join(KIT, 'buffalo-wallpaper-desktop-2560x1440.png'),
  await composite({ ...desk, ex: (desk.width - desk.emblemSize) / 2, ey: (desk.height - desk.emblemSize) / 2, opacity: 0.994 }),
);

// ── Previews for the kit tiles ──────────────────────────────────────────────
const preview = async (src, name, w) => {
  const out = path.join(PREV, name);
  await sharp(src).resize({ width: w }).webp({ quality: 84, alphaQuality: 100 }).toFile(out);
  const m = await sharp(out).metadata();
  return { src: `previews/${name}`, width: m.width, height: m.height };
};
const pv = {
  emblem: await preview(emblem[512], 'emblem.webp', 320),
  b: await preview(path.join(KIT, 'buffalo-b-cream.png'), 'b.webp', 200),
  x: await preview(path.join(KIT, 'buffalo-x-header-1500x500.png'), 'x-header.webp', 600),
  wall: await preview(path.join(KIT, 'buffalo-wallpaper-desktop-2560x1440.png'), 'wallpaper.webp', 600),
};

const f = (name) => path.join(KIT, name);
const tiles = [
  {
    id: 'emblem',
    name: 'The emblem',
    bg: 'vault',
    preview: pv.emblem,
    files: [512, 1024, 2048].map((s) => ({ href: `buffalo-emblem-${s}.png`, download: `buffalo-emblem-${s}.png`, format: 'PNG', meta: `${s} × ${s} · transparent · ${kb(f(`buffalo-emblem-${s}.png`))}` })),
  },
  {
    id: 'b',
    name: 'The Ƀ',
    glyph: true,
    bg: 'vault',
    preview: pv.b,
    files: bVariants.flatMap((v) => [
      { href: `buffalo-b-${v.id}.svg`, download: `buffalo-b-${v.id}.svg`, format: 'SVG', meta: `${v.label} · vector`, variant: `${v.label} SVG` },
      { href: `buffalo-b-${v.id}.png`, download: `buffalo-b-${v.id}.png`, format: 'PNG', meta: `${v.label} · ${bMeta.width} × ${bMeta.height}`, variant: `${v.label} PNG` },
    ]),
  },
  {
    id: 'x',
    name: 'X header',
    bg: 'vault',
    preview: pv.x,
    files: [{ href: 'buffalo-x-header-1500x500.png', download: 'buffalo-x-header-1500x500.png', format: 'PNG', meta: `1500 × 500 · ${kb(f('buffalo-x-header-1500x500.png'))}` }],
  },
  {
    id: 'wallpapers',
    name: 'Wallpapers',
    bg: 'vault',
    preview: pv.wall,
    files: [
      { href: 'buffalo-wallpaper-phone-1290x2796.png', download: 'buffalo-wallpaper-phone-1290x2796.png', format: 'PNG', meta: `Phone · 1290 × 2796 · ${kb(f('buffalo-wallpaper-phone-1290x2796.png'))}`, variant: 'phone' },
      { href: 'buffalo-wallpaper-desktop-2560x1440.png', download: 'buffalo-wallpaper-desktop-2560x1440.png', format: 'PNG', meta: `Desktop · 2560 × 1440 · ${kb(f('buffalo-wallpaper-desktop-2560x1440.png'))}`, variant: 'desktop' },
    ],
  },
];
fs.writeFileSync(path.join(ROOT, 'src/data/kit.json'), JSON.stringify({ tiles, sources: log }, null, 2) + '\n');

// ── Favicons ────────────────────────────────────────────────────────────────
// favicon.svg + 16/32/48: the Ƀ in cream on vault (legible at 16px).
// apple-touch-icon + manifest icons: logo-pack files (full emblem, edge to edge).
const bSvg = fs.readFileSync(path.join(LAYERS_DIR, 'b-symbol.svg'), 'utf8');
const vb = bSvg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
const bPath = bSvg.match(/<path[^>]*\/>/)[0];
const pad = 0.16; // Ƀ fills 68% of the tile height
const side = vb[3] / (1 - 2 * pad);
const favSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(vb[0] + vb[2] / 2 - side / 2).toFixed(2)} ${(vb[1] - side * pad).toFixed(2)} ${side.toFixed(2)} ${side.toFixed(2)}">` +
  `<rect x="${(vb[0] + vb[2] / 2 - side / 2).toFixed(2)}" y="${(vb[1] - side * pad).toFixed(2)}" width="${side.toFixed(2)}" height="${side.toFixed(2)}" rx="${(side * 0.14).toFixed(2)}" fill="${VAULT}"/>` +
  bPath +
  `</svg>\n`;
fs.writeFileSync(path.join(PUB, 'favicon.svg'), favSvg);
const icoPngs = [];
for (const s of [16, 32, 48]) {
  const png = await renderSvg(favSvg, { width: s });
  if (s !== 48) fs.writeFileSync(path.join(PUB, `favicon-${s}x${s}.png`), png);
  icoPngs.push({ s, png });
}
// ICO container with PNG-compressed entries.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoPngs.length, 4);
const dir = Buffer.alloc(16 * icoPngs.length);
let offset = 6 + dir.length;
icoPngs.forEach(({ s, png }, i) => {
  dir.writeUInt8(s, i * 16);
  dir.writeUInt8(s, i * 16 + 1);
  dir.writeUInt16LE(1, i * 16 + 4);
  dir.writeUInt16LE(32, i * 16 + 6);
  dir.writeUInt32LE(png.length, i * 16 + 8);
  dir.writeUInt32LE(offset, i * 16 + 12);
  offset += png.length;
});
fs.writeFileSync(path.join(PUB, 'favicon.ico'), Buffer.concat([header, dir, ...icoPngs.map((p) => p.png)]));

for (const [from, to] of [
  ['05_Web_and_Favicon/apple-touch-icon.png', 'apple-touch-icon.png'],
  ['05_Web_and_Favicon/android-chrome-192x192.png', 'icon-192.png'],
  ['05_Web_and_Favicon/android-chrome-512x512.png', 'icon-512.png'],
  ['05_Web_and_Favicon/maskable-icon-512x512.png', 'icon-maskable-512.png'],
]) {
  fs.copyFileSync(pack(from), path.join(PUB, to));
}

for (const name of fs.readdirSync(KIT).filter((n) => n !== 'previews')) console.log(`  kit/${name.padEnd(40)} ${kb(path.join(KIT, name))}`);
for (const l of log) console.log(`  ${l}`);
console.log('build-kit: done');
