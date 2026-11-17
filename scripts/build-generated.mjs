#!/usr/bin/env node
// Build-time generated, state-independent assets: the static guilloche fields
// (no-JS / reduced-motion / coarse-pointer fallback) and the borderless land mask.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/master.mjs';
import { makeField, fieldSvg, fieldExtent } from '../src/lib/guilloche.mjs';
import { landPath } from '../src/lib/map.mjs';

const OUT = path.join(ROOT, 'src/assets/generated');
fs.mkdirSync(OUT, { recursive: true });

const hero = makeField({ seed: 1913, rings: 96 });
const final = makeField({ seed: 2006, rings: 96 });
fs.writeFileSync(path.join(OUT, 'guilloche-hero.svg'), fieldSvg({ field: hero }));
fs.writeFileSync(path.join(OUT, 'guilloche-final.svg'), fieldSvg({ field: final, every: 2 }));

const map = landPath(1200);
const tx = -map.offset[0];
const ty = -map.offset[1];
fs.writeFileSync(
  path.join(OUT, 'land.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${map.width} ${map.height}"><path transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})" d="${map.d}"/></svg>`,
);

const meta = { guillocheExtent: fieldExtent(hero), map: { width: map.width, height: map.height } };
fs.writeFileSync(path.join(ROOT, 'src/data/generated.json'), JSON.stringify(meta, null, 2) + '\n');
for (const f of fs.readdirSync(OUT)) console.log(`  ${f.padEnd(22)} ${fs.statSync(path.join(OUT, f)).size} B`);
console.log('build-generated: done');
