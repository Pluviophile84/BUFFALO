#!/usr/bin/env node
// Build-time generated, state-independent assets: the guilloche field (the
// logo's own guilloche paths, for the static field and the canvas) and the
// borderless land mask.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseMaster } from './lib/master.mjs';
import { landPath } from '../src/lib/map.mjs';

const OUT = path.join(ROOT, 'src/assets/generated');
fs.mkdirSync(OUT, { recursive: true });
for (const old of ['guilloche-hero.svg', 'guilloche-final.svg']) fs.rmSync(path.join(OUT, old), { force: true });

// ── Guilloche field: the master's 162 guilloche paths ───────────────────────
// Source: <g id="frame"> → <g fill="none" stroke="#5E634A" stroke-width="1.1"
// stroke-linecap="round">, the paths only (no rim, ring or field circles).
// Every coordinate is kept exactly: the master writes absolute points in
// hundredths ("M 901.57,639.56 L 900.38,638.50 …", 198 KB gz); they are written
// here as exact hundredth steps ("M901.57 639.56l-1.19-1.06…", 44 KB gz), which
// decode to the very same points (tests/static/assets.spec.ts checks every one).
const master = parseMaster();
const source = [...master.guillocheGroup.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
if (source.length !== 162) throw new Error(`Master: expected 162 guilloche paths, found ${source.length}`);
const toHundredths = (d) => {
  const t = d.match(/[ML]|-?\d+(?:\.\d+)?/g);
  const pts = [];
  let cmd = 'L';
  for (let i = 0; i < t.length; ) {
    if (t[i] === 'M' || t[i] === 'L') cmd = t[i++];
    for (const n of [t[i], t[i + 1]]) if (!/^-?\d+(\.\d{1,2})?$/.test(n)) throw new Error(`Master: coordinate ${n} has more than 2 decimals`);
    pts.push([cmd, Math.round(Number(t[i++]) * 100), Math.round(Number(t[i++]) * 100)]);
    if (cmd === 'M') cmd = 'L'; // pairs after a moveto are linetos
  }
  return pts;
};
const num = (h) => (h / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace(/^(-?)0\./, '$1.');
/** Absolute hundredths → "Mx y" then exact relative steps "l dx dy …". */
const encode = (pts) => {
  let d = '';
  let px = 0;
  let py = 0;
  for (const [cmd, x, y] of pts) {
    if (cmd === 'M') d += `M${num(x)} ${num(y)}l`;
    else for (const v of [num(x - px), num(y - py)]) d += (v.startsWith('-') || d.endsWith('l') ? '' : ' ') + v;
    px = x;
    py = y;
  }
  return d.replace(/l(?=M|$)/g, '');
};
const fieldPaths = source.map((d) => encode(toHundredths(d)));
// the pattern's own disc: farthest point from the emblem's centre (500, 500)
let disc = 0;
for (const d of source) for (const [, x, y] of toHundredths(d)) disc = Math.max(disc, Math.hypot(x / 100 - 500, y / 100 - 500));
fs.writeFileSync(
  path.join(OUT, 'guilloche-field.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 40 920 920"><g id="field" fill="none" stroke="#5E634A" stroke-width="0.75" stroke-linecap="round">` +
    fieldPaths.map((d) => `<path vector-effect="non-scaling-stroke" d="${d}"/>`).join('') +
    `</g></svg>`,
);

const map = landPath(1200);
const tx = -map.offset[0];
const ty = -map.offset[1];
fs.writeFileSync(
  path.join(OUT, 'land.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${map.width} ${map.height}"><path transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})" d="${map.d}"/></svg>`,
);

// Field geometry, in units of the anchor's radius R (the coin; the final section's
// field wrap), unchanged from the generated field it replaces: box ±4.93R, lines
// from 1.07R (a calm ring around the coin) to 4.4R. The logo's disc is scaled so
// its edge sits at 4.4R, where the generated field's outermost ring was.
const field = { center: [500, 500], disc: Math.round(disc * 100) / 100, extent: 4.93, inner: 1.07, outer: 4.4, paths: fieldPaths.length };
const meta = { field, map: { width: map.width, height: map.height } };
fs.writeFileSync(path.join(ROOT, 'src/data/generated.json'), JSON.stringify(meta, null, 2) + '\n');
for (const f of fs.readdirSync(OUT)) console.log(`  ${f.padEnd(22)} ${fs.statSync(path.join(OUT, f)).size} B`);
console.log('build-generated: done');
