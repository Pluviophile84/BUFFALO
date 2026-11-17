import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PRE = 'http://127.0.0.1:4400';
export const LIVE = 'http://127.0.0.1:4401';
export const STATES = [
  { name: 'pre-issue', base: PRE, dist: path.join(ROOT, 'dist') },
  { name: 'live', base: LIVE, dist: path.join(ROOT, 'dist-live') },
] as const;
export const LIVE_CONTRACT = 'TestFixtureMint7pQ2rS9vWxYz3aBcDeFgHjKmNpump';

export function walk(dir: string, filter: (f: string) => boolean = () => true): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f, filter));
    else if (filter(f)) out.push(f);
  }
  return out;
}

export const readPng = (f: string | Buffer) => PNG.sync.read(typeof f === 'string' ? fs.readFileSync(f) : f);

/** Fraction of differing pixels (pixelmatch, threshold 0.1). Optional circle mask (compare inside only). */
export function diffRatio(a: PNG, b: PNG, opts: { mask?: 'circle'; out?: string } = {}): number {
  if (a.width !== b.width || a.height !== b.height) throw new Error(`size mismatch ${a.width}×${a.height} vs ${b.width}×${b.height}`);
  const { width: w, height: h } = a;
  let considered = w * h;
  if (opts.mask === 'circle') {
    considered = 0;
    const r = w / 2 - 1.5; // exclude the anti-aliased outer edge
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const inside = (x + 0.5 - w / 2) ** 2 + (y + 0.5 - h / 2) ** 2 <= r * r;
        if (inside) considered++;
        else for (const img of [a, b]) img.data[i] = img.data[i + 1] = img.data[i + 2] = img.data[i + 3] = 0;
      }
  }
  const diff = opts.out ? new PNG({ width: w, height: h }) : null;
  const n = pixelmatch(a.data, b.data, diff ? diff.data : null, w, h, { threshold: 0.1 });
  if (diff && opts.out) fs.writeFileSync(opts.out, PNG.sync.write(diff));
  return n / considered;
}

export function alphaBBox(png: PNG) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < png.height; y++)
    for (let x = 0; x < png.width; x++)
      if (png.data[(y * png.width + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x0, y0, x1, y1 };
}

export const BASE58_RUN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
