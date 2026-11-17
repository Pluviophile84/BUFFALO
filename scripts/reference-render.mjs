#!/usr/bin/env node
// Render the untouched master with resvg — the ground truth for every logo diff.
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { ROOT, readMaster } from './lib/master.mjs';

const out = path.join(ROOT, 'tests/fixtures');
fs.mkdirSync(out, { recursive: true });
const svg = readMaster();
for (const size of [1000, 2000]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(path.join(out, `master-${size}.png`), png);
  console.log(`  master-${size}.png ${png.length} B`);
}
console.log('reference-render: done');
