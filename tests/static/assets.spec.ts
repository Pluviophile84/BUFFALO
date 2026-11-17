// §11 asset pipeline integrity, §13.1 (exports) and §13.2 edge-to-edge.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PNG } from 'pngjs';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { ROOT, readPng, diffRatio, alphaBBox, walk } from '../helpers';

const master = fs.readFileSync(path.join(ROOT, 'assets/source/BUFFALO_Master_EdgeToEdge.svg'), 'utf8');
const renderMaster = (size: number) => readPng(new Resvg(master, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng());
const out = path.join(ROOT, 'test-results/diffs');
fs.mkdirSync(out, { recursive: true });
const report: Record<string, string> = {};

test.afterAll(() => {
  fs.writeFileSync(path.join(out, 'exports.json'), JSON.stringify(report, null, 2));
});

test('reference renders exist and match the master', () => {
  for (const s of [1000, 2000]) {
    const ref = readPng(path.join(ROOT, `tests/fixtures/master-${s}.png`));
    expect(diffRatio(ref, renderMaster(s))).toBe(0);
  }
});

test('extracted layers are lossless and exact', () => {
  const b64 = (id: string) => Buffer.from(master.match(new RegExp(`<image id="${id}"[^>]*href="data:image/png;base64,([^"]+)"`))![1]!, 'base64');
  const sha = (b: Buffer) => crypto.createHash('sha256').update(b).digest('hex');
  expect(sha(fs.readFileSync(path.join(ROOT, 'public/brand/bison.png')))).toBe(sha(b64('bison-raster')));
  expect(sha(fs.readFileSync(path.join(ROOT, 'public/brand/ground.png')))).toBe(sha(b64('ground-raster')));
  const frame = fs.readFileSync(path.join(ROOT, 'public/brand/frame.svg'), 'utf8');
  for (const fill of ['#947342', '#5D5C3C', '#7A8062']) expect(frame).toContain(fill);
  expect(frame).toContain('viewBox="40 40 920 920"');
  for (const [file, fill] of [['b-symbol.svg', '#EEE1C6'], ['b-symbol-ink.svg', '#1B1510'], ['b-symbol-bronze.svg', '#947342']] as const) {
    const s = fs.readFileSync(path.join(ROOT, 'public/brand', file), 'utf8');
    expect(s).toContain(`fill="${fill}"`);
    expect(s).toContain('viewBox="286.638 250 426.724 500"'); // tight bbox, computed
  }
  // the layer images never exceed native width
  for (const f of walk(path.join(ROOT, 'public/brand'), (f) => /bison-\d+\./.test(f))) {
    expect(Number(path.basename(f).match(/bison-(\d+)/)![1])).toBeLessThanOrEqual(1023);
  }
});

test('frame.svg (SVGO, tuned precision) renders like the master frame', async () => {
  const frame = fs.readFileSync(path.join(ROOT, 'public/brand/frame.svg'), 'utf8');
  const original = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 40 920 920">${master.match(/<g id="frame">[\s\S]*?<\/g>\s*<\/g>/)![0]}</svg>`;
  const r = (s: string) => readPng(new Resvg(s, { fitTo: { mode: 'width', value: 1000 } }).render().asPng());
  const ratio = diffRatio(r(original), r(frame));
  report['frame.svg vs master #frame @1000'] = `${(ratio * 100).toFixed(3)}%`;
  expect(ratio).toBeLessThan(0.001);
});

test('every emblem export fills its canvas edge to edge', () => {
  const files = [
    ...walk(path.join(ROOT, 'public/kit'), (f) => /buffalo-emblem-\d+\.png$/.test(f)),
    ...['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'icon-maskable-512.png'].map((f) => path.join(ROOT, 'public', f)),
  ];
  expect(files.length).toBe(7);
  for (const f of files) {
    const png = readPng(f);
    const b = alphaBBox(png);
    expect(b.x0, f).toBeLessThanOrEqual(1);
    expect(b.y0, f).toBeLessThanOrEqual(1);
    expect(b.x1, f).toBeGreaterThanOrEqual(png.width - 2);
    expect(b.y1, f).toBeGreaterThanOrEqual(png.height - 2);
  }
});

test('kit emblem exports match the master (< 0.5% differing pixels)', () => {
  for (const s of [512, 1024, 2048]) {
    const ratio = diffRatio(readPng(path.join(ROOT, `public/kit/buffalo-emblem-${s}.png`)), renderMaster(s), { out: path.join(out, `kit-emblem-${s}.png`) });
    report[`kit emblem ${s}`] = `${(ratio * 100).toFixed(3)}%`;
    expect(ratio, `emblem ${s}`).toBeLessThan(0.005);
  }
});

async function emblemRegionDiff(file: string, x: number, y: number, size: number, label: string) {
  const crop = await sharp(file).extract({ left: x, top: y, width: size, height: size }).ensureAlpha().png().toBuffer();
  const ratio = diffRatio(readPng(crop), renderMaster(size), { mask: 'circle', out: path.join(out, `${label}.png`) });
  report[label] = `${(ratio * 100).toFixed(3)}%`;
  return ratio;
}

test('OG image emblem region matches the master, whole and uncropped', async () => {
  for (const dist of ['dist', 'dist-live']) {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/og/og.json'), 'utf8'));
    const png = fs.readdirSync(path.join(ROOT, dist, 'og')).find((f) => f.endsWith('.png'))!;
    expect(png).toBe(dist === 'dist' ? 'buffalo-fourth-issue-specimen.png' : 'buffalo-fourth-issue.png');
    const og = path.join(ROOT, dist, 'og', png);
    const m = await sharp(og).metadata();
    expect([m.width, m.height]).toEqual([1200, 630]);
    const { x, y, size } = meta.emblem;
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + size).toBeLessThanOrEqual(1200);
    expect(y + size).toBeLessThanOrEqual(630);
    expect(await emblemRegionDiff(og, x, y, size, `og-emblem-${dist}`)).toBeLessThan(0.005);
  }
});

test('X header and wallpapers carry the emblem unaltered', async () => {
  const cases = [
    ['buffalo-x-header-1500x500.png', 1500 - 400 - 110, 50, 400],
    ['buffalo-wallpaper-phone-1290x2796.png', (1290 - 780) / 2, (2796 - 780) / 2, 780],
    ['buffalo-wallpaper-desktop-2560x1440.png', (2560 - 720) / 2, (1440 - 720) / 2, 720],
  ] as const;
  for (const [f, x, y, s] of cases) {
    expect(await emblemRegionDiff(path.join(ROOT, 'public/kit', f), x, y, s, f.replace('.png', ''))).toBeLessThan(0.005);
  }
});

test('Mark hotspots sit on their layers (sampled on the reference render)', () => {
  const ref = readPng(path.join(ROOT, 'tests/fixtures/master-1000.png'));
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/sections.css'), 'utf8');
  const at = (id: string) => {
    const m = css.match(new RegExp(`\\.hotspot--${id} \\{\\s*left: ([\\d.]+)%;\\s*top: ([\\d.]+)%;`))!;
    const x = Math.round((Number(m[1]) / 100) * 1000);
    const y = Math.round((Number(m[2]) / 100) * 1000);
    const i = (y * 1000 + x) * 4;
    return [ref.data[i]!, ref.data[i + 1]!, ref.data[i + 2]!];
  };
  const near = (c: number[], hex: string, tol: number) => {
    const t = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
    return Math.max(...c.map((v, k) => Math.abs(v - t[k]!))) <= tol;
  };
  expect(near(at('rim'), '#947342', 24), 'rim').toBe(true);
  expect(near(at('b'), '#EEE1C6', 10), 'Ƀ').toBe(true);
  const field = at('field');
  expect(near(field, '#7A8062', 30) || near(field, '#5E634A', 30), 'field').toBe(true);
  const g = at('guilloche');
  expect(near(g, '#7A8062', 30) || near(g, '#5E634A', 30), 'guilloche').toBe(true);
  const bison = at('bison');
  expect(bison[0]! > bison[2]! + 15 && bison[0]! < 200, `bison brown ${bison}`).toBe(true);
});

test('historical plates: provenance files present, never upscaled', () => {
  const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/history.json'), 'utf8'));
  for (const [id, v] of Object.entries<{ original: { width: number }; sizes: { width: number }[]; source: string }>(h)) {
    expect(fs.existsSync(path.join(ROOT, 'assets/historical', v.source)), id).toBe(true);
    for (const s of v.sizes) expect(s.width).toBeLessThanOrEqual(v.original.width);
  }
  expect(fs.readFileSync(path.join(ROOT, 'ASSET-SOURCES.md'), 'utf8')).toContain('2006_American_Buffalo_Proof_Reverse');
});

test('map data contains land only (no country boundaries can exist)', () => {
  const topo = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/world-atlas/land-110m.json'), 'utf8'));
  expect(Object.keys(topo.objects)).toEqual(['land']);
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/map.mjs'), 'utf8');
  expect(src).not.toMatch(/countries/);
});

test('manifest and favicons', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/site.webmanifest'), 'utf8'));
  expect(m.name).toBe('BUFFALO');
  expect(m.short_name).toBe('$BUFFALO');
  for (const i of m.icons) expect(fs.existsSync(path.join(ROOT, 'public', i.src))).toBe(true);
  for (const [f, s] of [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]] as const) {
    const p = readPng(path.join(ROOT, 'public', f));
    expect([p.width, p.height], f).toEqual([s, s]);
  }
  expect(fs.readFileSync(path.join(ROOT, 'public/favicon.svg'), 'utf8')).toContain('#EEE1C6');
  void PNG;
});
