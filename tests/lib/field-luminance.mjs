// Perceived intensity of the guilloche field (fixes batch 2, fix 3).
//
// The guilloche area = the hero minus the nav, the text block's clear field
// (its text and buttons), the coin, the security thread with its windows and the
// SPECIMEN stamp; or, for the final section, the section minus its text panel.
// The page is captured with the field shown and hidden. Reported:
//   meanY        mean linear relative luminance of the area, field shown
//   contribution mean luminance the field adds (shown − hidden): the background
//                and vignette cancel out, only the lines are measured.
import { PNG } from 'pngjs';

const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const Y = (d, i) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);

/** Everything that draws the field (static SVG and the canvas). */
export const FIELD = '.field, .guilloche-canvas';

/** The measured area in viewport px. */
export async function fieldRegion(page, where = 'hero') {
  return page.evaluate((where) => {
    const r = (el) => el && el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = innerHeight;
    if (where === 'final') {
      const s = r(document.querySelector('.final'));
      const p = r(document.querySelector('.final__panel'));
      return { area: { x0: 0, y0: Math.max(64, s.top), x1: vw, y1: Math.min(vh, s.bottom) }, rects: [p], circles: [] };
    }
    const hero = r(document.querySelector('.hero'));
    const copy = r(document.querySelector('.hero__copy'));
    const coin = r(document.querySelector('.hero__coin'));
    const twoColumn = copy.right <= coin.left;
    const area = { x0: 0, y0: Math.max(64, hero.top), x1: vw, y1: Math.min(vh, hero.bottom) };
    const rects = [];
    // the text block's solid backing: left of it (two columns) or below its top (one)
    if (twoColumn) rects.push({ left: 0, top: 0, right: copy.right + 2, bottom: vh });
    else rects.push({ left: 0, top: copy.top - 2, right: vw, bottom: vh });
    const cx = coin.left + coin.width / 2;
    rects.push({ left: cx - 8, top: 0, right: cx + 8, bottom: vh }); // security thread
    for (const el of document.querySelectorAll('.thread__win, .hero__stamp')) {
      const b = r(el);
      if (b && b.width) rects.push({ left: b.left - 4, top: b.top - 4, right: b.right + 4, bottom: b.bottom + 4 });
    }
    return { area, rects, circles: [{ cx, cy: coin.top + coin.height / 2, r: coin.width / 2 + 4 }] };
  }, where);
}

export function inRegion({ area, rects, circles }) {
  return (x, y) =>
    x >= area.x0 && x < area.x1 && y >= area.y0 && y < area.y1 &&
    !rects.some((b) => x >= b.left && x < b.right && y >= b.top && y < b.bottom) &&
    !circles.some((c) => (x + 0.5 - c.cx) ** 2 + (y + 0.5 - c.cy) ** 2 <= c.r ** 2);
}

/**
 * @param {import('@playwright/test').Page} page  loaded and settled (scroll position set)
 * @param {'hero'|'final'} where
 */
export async function measureField(page, where = 'hero') {
  const region = await fieldRegion(page, where);
  const inside = inRegion(region);
  const on = PNG.sync.read(await page.screenshot());
  await page.evaluate((sel) => document.querySelectorAll(sel).forEach((e) => (e.style.visibility = 'hidden')), FIELD);
  await page.waitForTimeout(150);
  const off = PNG.sync.read(await page.screenshot());
  await page.evaluate((sel) => document.querySelectorAll(sel).forEach((e) => (e.style.visibility = '')), FIELD);
  const w = on.width;
  const s = on.width / (await page.evaluate(() => document.documentElement.clientWidth)); // device px per CSS px
  let n = 0;
  let sumOn = 0;
  let sumDiff = 0;
  for (let y = 0; y < on.height; y++)
    for (let x = 0; x < w; x++) {
      if (!inside((x + 0.5) / s - 0.5, (y + 0.5) / s - 0.5)) continue;
      const i = (y * w + x) * 4;
      const a = Y(on.data, i);
      sumOn += a;
      sumDiff += a - Y(off.data, i);
      n++;
    }
  return { pixels: n, meanY: sumOn / n, contribution: sumDiff / n };
}
