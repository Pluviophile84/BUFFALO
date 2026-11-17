#!/usr/bin/env node
// OG image 1200×630 (state-dependent: pre-issue adds a SPECIMEN stamp).
// Runs as part of `npm run build`, after the config has been validated.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib/master.mjs';
import { renderSvg, renderMaster, fieldPaths } from './lib/render.mjs';
import { makeField } from '../src/lib/guilloche.mjs';
import { deriveIssue } from '../src/lib/validate-issue.mjs';

// Load the same config the site build will use (fixture support mirrors astro.config.mjs).
const cfgPath = process.env.BUFFALO_ISSUE_FIXTURE && !process.env.VERCEL ? path.resolve(ROOT, process.env.BUFFALO_ISSUE_FIXTURE) : path.join(ROOT, 'src/config/issue.ts');
const { ISSUE } = await import(cfgPath);
const issue = deriveIssue(ISSUE); // throws (fails the build) on an invalid config

const W = 1200;
const H = 630;
const E = 470; // emblem, whole and uncropped
const ex = W - E - 64;
const ey = (H - E) / 2;
const field = makeField({ seed: 1913, rings: 96 });

const left = 72;
const stamp = issue.live
  ? ''
  : `<g transform="translate(${left} 470)" fill="none" stroke="#C29E66" stroke-opacity="0.85"><rect x="0.5" y="0.5" width="171" height="29"/><rect x="3.5" y="3.5" width="165" height="23"/><text x="86" y="19.5" text-anchor="middle" stroke="none" fill="#C29E66" font-family="JetBrains Mono" font-size="12" letter-spacing="3.4">SPECIMEN</text></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="100%" height="100%" fill="#0E100B"/>
${fieldPaths({ field, R: E / 2, cx: ex + E / 2, cy: ey + E / 2, width: W, height: H, stroke: 1, opacity: 0.75 })}
<rect x="${left - 32}" y="120" width="${ex - left - 8}" height="${H - 240 + 40}" fill="#0E100B"/>
<text x="${left}" y="182" font-family="JetBrains Mono" font-size="17" letter-spacing="3" fill="#C29E66">THE FOURTH ISSUE</text>
<text font-family="Libre Caslon Display" font-size="70" fill="#EEE1C6" letter-spacing="-0.8"><tspan x="${left}" y="282">Now it belongs</tspan><tspan x="${left}" y="356">to no nation.</tspan></text>
<text x="${left}" y="430" font-family="JetBrains Mono" font-size="16" letter-spacing="3.2" fill="#9A937F">BUFFALO · $BUFFALO</text>
${stamp}
</svg>`;

const bg = await renderSvg(svg);
const png = await sharp(bg)
  .composite([{ input: renderMaster(E), left: ex, top: ey }])
  .png({ compressionLevel: 9 })
  .toBuffer();
const outDir = path.join(ROOT, 'public/og');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
// Variant-specific filename so social caches refresh at issue.
const name = issue.live ? 'buffalo-fourth-issue.png' : 'buffalo-fourth-issue-specimen.png';
fs.writeFileSync(path.join(outDir, name), png);
fs.writeFileSync(path.join(outDir, 'og.json'), JSON.stringify({ file: `/og/${name}`, width: W, height: H, emblem: { x: ex, y: ey, size: E } }) + '\n');
console.log(`  og/${name} ${Math.round(png.length / 1024)} KB`);
console.log('build-og: done');
