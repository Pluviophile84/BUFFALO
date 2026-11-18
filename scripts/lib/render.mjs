// Shared raster helpers for the OG image and the Custodian Kit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import subsetFont from 'subset-font';
import { Resvg } from '@resvg/resvg-js';
import { ROOT, readMaster } from './master.mjs';
import generated from '../../src/data/generated.json' with { type: 'json' };

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
 * The guilloche field for rasters (OG image, Custodian Kit): the logo's own 162
 * guilloche paths (src/assets/generated/guilloche-field.svg), placed as on the
 * site: centred on an emblem of radius R at (cx, cy), the logo's disc scaled so
 * its edge falls at 4.4R, clear inside 1.07R. The stroke is in output px (resvg
 * has no non-scaling stroke, so it is compensated for the scale); `opacity` is
 * each path's stroke opacity.
 */
export function fieldPaths({ cx, cy, R, width, height, stroke = 1, opacity = 1, id = 'field' }) {
  const f = generated.field;
  const svg = fs.readFileSync(path.join(ROOT, 'src/assets/generated/guilloche-field.svg'), 'utf8');
  const paths = svg.match(/<g id="field"[^>]*>([\s\S]*)<\/g>/)[1].replaceAll(' vector-effect="non-scaling-stroke"', '');
  const k = (f.outer * R) / f.disc;
  const r0 = f.inner * R;
  const n = (v) => Number(v.toFixed(3));
  return (
    `<defs><clipPath id="${id}-clip"><path clip-rule="evenodd" d="M0 0h${width}v${height}h${-width}z M${n(cx + r0)} ${n(cy)}a${n(r0)} ${n(r0)} 0 1 0 ${n(-2 * r0)} 0a${n(r0)} ${n(r0)} 0 1 0 ${n(2 * r0)} 0z"/></clipPath></defs>` +
    `<g clip-path="url(#${id}-clip)"><g transform="translate(${n(cx - f.center[0] * k)} ${n(cy - f.center[1] * k)}) scale(${n(k)})" fill="none" stroke="#5E634A" stroke-width="${n(stroke / k)}" stroke-opacity="${opacity}" stroke-linecap="round">${paths}</g></g>`
  );
}
