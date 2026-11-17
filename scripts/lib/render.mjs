// Shared raster helpers for the OG image and the Custodian Kit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import subsetFont from 'subset-font';
import { Resvg } from '@resvg/resvg-js';
import { ROOT, readMaster } from './master.mjs';
import { ringRadius } from '../../src/lib/guilloche.mjs';

let fontFiles;
/** resvg needs TTF/OTF: convert the site's own fonts (same faces as the web). */
export async function fontFilesForRender() {
  if (fontFiles) return fontFiles;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'buffalo-fonts-'));
  const nm = path.join(ROOT, 'node_modules');
  const src = {
    'caslon-display.ttf': '@fontsource/libre-caslon-display/files/libre-caslon-display-latin-400-normal.woff2',
    'jetbrains-mono.ttf': '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  };
  fontFiles = [];
  for (const [name, rel] of Object.entries(src)) {
    const buf = fs.readFileSync(path.join(nm, rel));
    const ttf = await subsetFont(buf, null, {
      targetFormat: 'sfnt',
      keepAllGlyphs: true,
      ...(name.startsWith('jetbrains') ? { variationAxes: { wght: 400 } } : {}),
    });
    const f = path.join(dir, name);
    fs.writeFileSync(f, ttf);
    fontFiles.push(f);
  }
  return fontFiles;
}

export async function renderSvg(svg, { width, background } = {}) {
  const opts = {
    font: { fontFiles: await fontFilesForRender(), loadSystemFonts: false, defaultFontFamily: 'JetBrains Mono' },
    ...(width ? { fitTo: { mode: 'width', value: width } } : {}),
    ...(background ? { background } : {}),
  };
  return new Resvg(svg, opts).render().asPng();
}

/** The untouched master, rendered edge to edge at `size` px (transparent corners). */
export function renderMaster(size) {
  return new Resvg(readMaster(), { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng();
}

/**
 * Guilloche rings in absolute pixel space for rasters (no <use>, fixed stroke).
 * Points outside the canvas are culled so files stay small.
 */
export function fieldPaths({ field, R, cx, cy, width, height, stroke = 1, opacity = 1, step = 3, every = 1 }) {
  let out = '';
  for (const g of field.rings) {
    if (g.i % every) continue;
    const n = Math.max(48, Math.ceil((2 * Math.PI * g.base * R) / step));
    let d = '';
    let pen = false;
    for (let j = 0; j <= n; j++) {
      const th = (j / n) * 2 * Math.PI;
      const r = ringRadius(field, g, th) * R;
      const x = cx + r * Math.cos(th);
      const y = cy + r * Math.sin(th);
      const inside = x > -20 && x < width + 20 && y > -20 && y < height + 20;
      if (inside) {
        d += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
        pen = true;
      } else pen = false;
    }
    if (d) out += `<path d="${d}" stroke-opacity="${(g.alpha * opacity).toFixed(3)}"/>`;
  }
  return `<g fill="none" stroke="#5E634A" stroke-width="${stroke}" stroke-linecap="round">${out}</g>`;
}
