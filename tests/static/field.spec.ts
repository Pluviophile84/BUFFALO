// Fix 3 (batch 2): the guilloche field is the logo's own guilloche, the master's 162
// paths with every coordinate unchanged; the generated field and its generator are gone.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../helpers';

const master = fs.readFileSync(path.join(ROOT, 'assets/source/BUFFALO_Master_EdgeToEdge.svg'), 'utf8');
const field = fs.readFileSync(path.join(ROOT, 'src/assets/generated/guilloche-field.svg'), 'utf8');

/** Points of a path in hundredths of a master unit (absolute M/L or relative l). */
function points(d: string): [number, number][] {
  const t = d.match(/[MLml]|-?(?:\d+\.?\d*|\.\d+)/g)!;
  const pts: [number, number][] = [];
  let c = 'L';
  let x = 0;
  let y = 0;
  for (let i = 0; i < t.length; ) {
    if (/^[MLml]$/.test(t[i]!)) c = t[i++]!;
    const a = Number(t[i++]);
    const b = Number(t[i++]);
    if (c === 'M' || c === 'L') [x, y] = [a, b];
    else [x, y] = [x + a, y + b];
    pts.push([Math.round(x * 100), Math.round(y * 100)]);
    if (c === 'M') c = 'L';
    if (c === 'm') c = 'l';
  }
  return pts;
}

test('the field is the master frame guilloche: 162 paths, every point identical', () => {
  const frame = master.match(/<g id="frame">([\s\S]*?<\/g>)\s*<\/g>/)![1]!;
  const group = frame.slice(frame.indexOf('<g fill="none" stroke="#5E634A" stroke-width="1.1"'));
  const src = [...group.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]!);
  const out = [...field.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]!);
  expect(src).toHaveLength(162);
  expect(out).toHaveLength(162);
  let n = 0;
  src.forEach((d, i) => {
    const a = points(d);
    const b = points(out[i]!);
    expect(b.length, `path ${i}`).toBe(a.length);
    for (let j = 0; j < a.length; j++) {
      if (a[j]![0] !== b[j]![0] || a[j]![1] !== b[j]![1]) throw new Error(`path ${i} point ${j}: ${a[j]} vs ${b[j]}`);
      n++;
    }
  });
  expect(n).toBeGreaterThan(30_000);
  // only the paths: no rim, ring or field circles; the field's own stroke
  expect(field).not.toMatch(/<circle|<image|<rect/);
  expect(field).toMatch(/<g id="field" fill="none" stroke="#5E634A" stroke-width="0.75"/);
  expect((field.match(/vector-effect="non-scaling-stroke"/g) ?? []).length).toBe(162);
});

test('the generated field and its generator are gone', () => {
  for (const f of ['src/lib/guilloche.mjs', 'src/lib/guilloche.d.mts', 'src/assets/generated/guilloche-hero.svg', 'src/assets/generated/guilloche-final.svg'])
    expect(fs.existsSync(path.join(ROOT, f)), f).toBe(false);
  for (const dir of ['src', 'scripts'])
    for (const f of fs.readdirSync(path.join(ROOT, dir), { recursive: true }) as string[])
      if (/\.(m?js|ts|astro)$/.test(f)) expect(fs.readFileSync(path.join(ROOT, dir, f), 'utf8'), f).not.toMatch(/makeField|ringRadius|lib\/guilloche/);
});
