// Shared helpers for reading the locked master emblem.
// Nothing here alters artwork: it only parses, extracts and measures.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MASTER_PATH = path.join(ROOT, 'assets/source/BUFFALO_Master_EdgeToEdge.svg');
export const BRAND_DIR = path.join(ROOT, 'public/brand');
export const PACK_DIR = path.join(ROOT, 'assets/logo-pack');

export function readMaster() {
  return fs.readFileSync(MASTER_PATH, 'utf8');
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

/** Parse the master into its verified layers. Throws if the anatomy changed. */
export function parseMaster(svg = readMaster()) {
  const root = svg.match(/<svg[^>]*>/)[0];
  const viewBox = attr(root, 'viewBox');
  if (viewBox !== '40 40 920 920') throw new Error(`Unexpected master viewBox: ${viewBox}`);

  const frameMatch = svg.match(/<g id="frame">([\s\S]*?<\/g>)\s*<\/g>/);
  if (!frameMatch) throw new Error('Master: #frame not found');
  const frameInner = frameMatch[1];
  const circles = [...frameInner.matchAll(/<circle[^>]*\/>/g)].map((m) => ({
    cx: Number(attr(m[0], 'cx')),
    cy: Number(attr(m[0], 'cy')),
    r: Number(attr(m[0], 'r')),
    fill: attr(m[0], 'fill'),
  }));
  if (circles.length !== 3) throw new Error('Master: expected 3 frame circles');
  const guillocheOpen = frameInner.match(/<g fill="none"[^>]*>/)[0];
  const guillocheGroup = frameInner.slice(frameInner.indexOf(guillocheOpen));

  const reg = svg.match(/<g id="registered-artwork" transform="matrix\(([^)]+)\)">/);
  if (!reg) throw new Error('Master: #registered-artwork not found');
  const [a, b, c, d, e, f] = reg[1].trim().split(/\s+/).map(Number);
  if (b !== 0 || c !== 0 || a !== d) throw new Error('Master: registered-artwork transform is not a uniform scale');

  const image = (id) => {
    const tag = svg.match(new RegExp(`<image id="${id}"[^>]*/>`))[0];
    const href = attr(tag, 'href');
    const m = href.match(/^data:([^;]+);base64,(.+)$/);
    return {
      x: Number(attr(tag, 'x')),
      y: Number(attr(tag, 'y')),
      width: Number(attr(tag, 'width')),
      height: Number(attr(tag, 'height')),
      mime: m[1],
      data: Buffer.from(m[2], 'base64'),
    };
  };

  const bLayer = svg.match(/<g id="buffalo-b-layer" transform="([^"]+)"/);
  const bPath = svg.match(/<path id="buffalo-currency-sign"[^>]*\/>/)[0];

  return {
    viewBox,
    circles,
    frameInner,
    guillocheOpen,
    guillocheGroup,
    registered: { a, b, c, d, e, f, matrix: reg[1].trim() },
    ground: image('ground-raster'),
    bison: image('bison-raster'),
    bTransform: bLayer[1],
    bPath: { d: attr(bPath, 'd'), fill: attr(bPath, 'fill'), fillRule: attr(bPath, 'fill-rule') },
  };
}

/** Place a registered-artwork raster into master user space. */
export function placeInMaster(reg, img) {
  return {
    x: reg.e + reg.a * img.x,
    y: reg.f + reg.d * img.y,
    width: reg.a * img.width,
    height: reg.d * img.height,
  };
}

// ---- Path utilities for the Ƀ (absolute M/L/H/V/C/Z only, as in the master) ----

export function tokenizePath(d) {
  return d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
}

/** Parse the B transform: translate(tx ty) scale(s) translate(ux uy) → x' = s*(x+ux)+tx */
export function parseBTransform(t) {
  const m = t.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)\s*scale\(([-\d.]+)\)\s*translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
  if (!m) throw new Error(`Unexpected Ƀ transform: ${t}`);
  const [tx, ty, s, ux, uy] = m.slice(1).map(Number);
  return { tx, ty, s, ux, uy, apply: (x, y) => [s * (x + ux) + tx, s * (y + uy) + ty] };
}

/** Bake a uniform transform into the path and return { d, bbox } with exact cubic extrema. */
export function bakePath(d, apply, precision = 3) {
  const tok = tokenizePath(d);
  const out = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = '';
  const pts = [];
  const fmt = (n) => Number(n.toFixed(precision)).toString();
  const num = () => Number(tok[i++]);
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const addPt = (x, y) => {
    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxY = Math.max(bounds.maxY, y);
  };
  const cubicExtrema = (p0, p1, p2, p3) => {
    // roots of derivative of 1-D cubic bezier
    const a = -p0 + 3 * p1 - 3 * p2 + p3;
    const b = 2 * (p0 - 2 * p1 + p2);
    const c = p1 - p0;
    const ts = [];
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) > 1e-12) ts.push(-c / b);
    } else {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const r = Math.sqrt(disc);
        ts.push((-b + r) / (2 * a), (-b - r) / (2 * a));
      }
    }
    return ts.filter((t) => t > 0 && t < 1);
  };
  const bez = (p0, p1, p2, p3, t) =>
    (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3;

  while (i < tok.length) {
    if (/[MLHVCZ]/i.test(tok[i])) cmd = tok[i++];
    if (cmd !== cmd.toUpperCase()) throw new Error('Relative path commands are not expected in the master Ƀ');
    switch (cmd) {
      case 'M':
      case 'L': {
        const x = num();
        const y = num();
        const [X, Y] = apply(x, y);
        out.push(`${cmd}${fmt(X)} ${fmt(Y)}`);
        addPt(X, Y);
        cx = x;
        cy = y;
        if (cmd === 'M') {
          sx = x;
          sy = y;
          cmd = 'L';
        }
        break;
      }
      case 'H': {
        const x = num();
        const [X, Y] = apply(x, cy);
        out.push(`L${fmt(X)} ${fmt(Y)}`);
        addPt(X, Y);
        cx = x;
        break;
      }
      case 'V': {
        const y = num();
        const [X, Y] = apply(cx, y);
        out.push(`L${fmt(X)} ${fmt(Y)}`);
        addPt(X, Y);
        cy = y;
        break;
      }
      case 'C': {
        const c = [num(), num(), num(), num(), num(), num()];
        const [p0x, p0y] = apply(cx, cy);
        const [x1, y1] = apply(c[0], c[1]);
        const [x2, y2] = apply(c[2], c[3]);
        const [x3, y3] = apply(c[4], c[5]);
        out.push(`C${fmt(x1)} ${fmt(y1)} ${fmt(x2)} ${fmt(y2)} ${fmt(x3)} ${fmt(y3)}`);
        addPt(x3, y3);
        for (const t of cubicExtrema(p0x, x1, x2, x3)) addPt(bez(p0x, x1, x2, x3, t), bez(p0y, y1, y2, y3, t));
        for (const t of cubicExtrema(p0y, y1, y2, y3)) addPt(bez(p0x, x1, x2, x3, t), bez(p0y, y1, y2, y3, t));
        cx = c[4];
        cy = c[5];
        break;
      }
      case 'Z':
        out.push('Z');
        cx = sx;
        cy = sy;
        break;
      default:
        throw new Error(`Unsupported command ${cmd}`);
    }
    pts.push([cx, cy]);
  }
  return { d: out.join(''), bbox: bounds };
}
