// Fix 2: the hero coin is centred in its own column at every size, and what is
// centred on the coin (guilloche field, security thread, vignette) shares its centre.
//
// Cause of the old offset: on two-column layouts the coin was centred in grid track
// 7–12, but that track is not the open area to the right of the text block. It
// starts a column gap (24px) after the text block's edge and ends at the page
// margin (and, above 1416px, short of the space beside the max-width container),
// while the field and the dark ground run on to the hero's right edge. The column
// now spans exactly that area: text block edge → hero edge.
import { test, expect, type Page } from '@playwright/test';
import { PRE } from '../helpers';

const SIZES = [
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
] as const;

const geometry = (page: Page) =>
  page.evaluate(() => {
    const box = (sel: string) => {
      const r = document.querySelector(sel)!.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2, width: r.width };
    };
    return {
      coin: box('.hero__coin'),
      col: box('.hero__coincol'),
      copy: box('.hero__copy'),
      hero: box('.hero'),
      thread: box('.hero__coincol .thread'),
      field: box('.field--hero'),
      vignette: box('.hero__vignette'),
      stamp: document.querySelector('.hero__stamp') ? box('.hero__stamp') : null,
    };
  });

for (const gutter of ['stable', 'auto'] as const)
  for (const [width, height] of SIZES)
    test(`hero coin centred in its column — ${width}×${height}, scrollbar gutter ${gutter === 'stable' ? 'reserved' : 'none (overlay scrollbars)'}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(PRE + '/', { waitUntil: 'networkidle' });
      await page.evaluate((g) => (document.documentElement.style.scrollbarGutter = g), gutter);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const g = await geometry(page);
      const twoColumn = g.copy.right <= g.coin.left; // side by side (≥ 1024px)

      // the coin's centre is its container's centre (±1px)
      expect(Math.abs(g.coin.cx - g.col.cx)).toBeLessThanOrEqual(1);
      if (twoColumn) {
        // the container is the open area right of the text block, to the hero's edge
        expect(Math.abs(g.col.left - g.copy.right)).toBeLessThanOrEqual(1);
        expect(Math.abs(g.col.right - g.hero.right)).toBeLessThanOrEqual(1);
        // the coin never overlaps the text block
        expect(g.coin.left).toBeGreaterThanOrEqual(g.copy.right);
        expect(g.coin.right).toBeLessThanOrEqual(g.hero.right);
      } else {
        // single column: centred on the page, as before
        expect(Math.abs(g.coin.cx - (g.hero.left + g.hero.right) / 2)).toBeLessThanOrEqual(1);
      }
      // everything centred on the coin shares its centre; the thread passes through it
      for (const k of ['thread', 'field', 'vignette'] as const) expect(Math.abs(g[k].cx - g.coin.cx), k).toBeLessThanOrEqual(1);
      expect(Math.abs(g.field.cy - g.coin.cy)).toBeLessThanOrEqual(1);
      expect(g.thread.top).toBeLessThan(g.coin.top);
      expect(g.thread.bottom).toBeGreaterThan(g.coin.bottom);
      // the specimen stamp keeps its place relative to the coin: above it, right-aligned
      // with it (two columns); below it, clear of the thread (one column)
      if (g.stamp) {
        if (twoColumn) {
          expect(Math.abs(g.stamp.right - g.coin.right)).toBeLessThanOrEqual(1);
          expect(g.stamp.bottom).toBeLessThanOrEqual(g.coin.top);
        } else {
          expect(g.stamp.top).toBeGreaterThanOrEqual(g.coin.bottom);
          expect(g.stamp.right).toBeLessThanOrEqual(g.thread.left);
        }
      }
      await ctx.close();
    });

test('the coin keeps its size and vertical position; no rule under it', async ({ browser }) => {
  // values measured on the first version (before these fixes), overlay scrollbars
  const before: Record<number, { top: number; width: number }> = {
    375: { top: 129, width: 292.5 },
    768: { top: 129, width: 430.08 },
    1024: { top: 352.44, width: 445.44 },
    1280: { top: 284.92, width: 464 },
    1440: { top: 247.8, width: 522 },
    1920: { top: 313.5, width: 560 },
  };
  for (const [width, height] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => (document.documentElement.style.scrollbarGutter = 'auto'));
    const g = await geometry(page);
    expect(Math.abs(g.coin.top - before[width]!.top), `top @${width}`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(g.coin.width - before[width]!.width), `width @${width}`).toBeLessThanOrEqual(0.5);
    expect(await page.locator('.hero .engraved-rule, .hero__ground').count()).toBe(0);
    expect(await page.locator('.hero__coin [data-layer="ground"]').count()).toBe(1); // the emblem's own ground line stays
    await ctx.close();
  }
});
