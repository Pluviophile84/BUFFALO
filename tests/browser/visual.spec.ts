// §13.6 Visual QA: full-page screenshots at 8 widths (fonts loaded, animations
// complete), no horizontal overflow, no overlapping text boxes in the hero.
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { STATES, ROOT } from '../helpers';

const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440, 1920];
const SHOTS = path.join(ROOT, 'tests/screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // full-page captures paint beyond the viewport: render content-visibility:auto sections
  await page.evaluate(() => document.querySelectorAll<HTMLElement>('section, footer').forEach((s) => (s.style.contentVisibility = 'visible')));
  // pull every ink impression so the capture shows final states
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')));
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20_000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

async function heroBoxes(page: Page) {
  return page.evaluate(() => {
    const sel = ['.hero__eyebrow', '.hero__lead', '.hero__h1', '.hero__body', '.hero__actions .btn', '.hero__actions .helper', '.hero__serial', '.hero__note', '.hero__stamp'];
    const boxes: { name: string; r: DOMRect }[] = [];
    for (const s of sel) document.querySelectorAll(s).forEach((el, i) => boxes.push({ name: `${s}#${i}`, r: el.getBoundingClientRect() }));
    // text inside the hero copy must never overlap the coin's circle either
    const c = document.querySelector('.hero__coin')!.getBoundingClientRect();
    return { boxes: boxes.map((b) => ({ name: b.name, x: b.r.left, y: b.r.top, w: b.r.width, h: b.r.height })), coin: { cx: c.left + c.width / 2, cy: c.top + c.height / 2, r: c.width / 2 } };
  });
}

const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5;
const rectHitsCircle = (r: { x: number; y: number; w: number; h: number }, c: { cx: number; cy: number; r: number }) => {
  const nx = Math.max(r.x, Math.min(c.cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.cy, r.y + r.h));
  return (nx - c.cx) ** 2 + (ny - c.cy) ** 2 < (c.r - 0.5) ** 2;
};

for (const st of STATES)
  for (const width of WIDTHS) {
    const capture = st.name === 'pre-issue' || width === 375 || width === 1440;
    test(`visual ${st.name} @${width}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(st.base + '/', { waitUntil: 'networkidle' });
      await settle(page);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, 'horizontal overflow').toBe(0);

      const { boxes, coin } = await heroBoxes(page);
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i]!;
          const b = boxes[j]!;
          if (a.name.startsWith('.hero__lead') && b.name.startsWith('.hero__h1')) continue; // same <h1>, stacked
          expect(overlap(a, b), `${a.name} overlaps ${b.name}`).toBe(false);
        }
      for (const b of boxes) expect(rectHitsCircle(b, coin), `${b.name} touches the coin`).toBe(false);

      // every emblem instance outside the provenance scroller is whole on screen horizontally
      const cut = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll('.coin')]
          .filter((c) => !(c.closest('.provenance__scroller') && getComputedStyle(c.closest('.provenance__scroller')!).overflowX === 'auto'))
          .map((c) => c.getBoundingClientRect())
          .filter((r) => r.left < -0.5 || r.right > vw + 0.5).length;
      });
      expect(cut, 'an emblem is cropped by the viewport').toBe(0);

      // plates stay inside their card's content box (never over the engraved frame)
      const spill = await page.evaluate(() =>
        [...document.querySelectorAll('.card--framed')].map((c) => {
          const inner = c.querySelector('.card__inner')!;
          const cs = getComputedStyle(inner);
          const ib = inner.getBoundingClientRect();
          const pb = c.querySelector('.card__plate')!.getBoundingClientRect();
          return pb.right - (ib.right - parseFloat(cs.paddingRight)) + (ib.left + parseFloat(cs.paddingLeft) - pb.left);
        }),
      );
      for (const sp of spill) expect(sp).toBeLessThanOrEqual(0.5);

      // historical plates never render above half their source width (≥ 2× density)
      const plates = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLImageElement>('[data-card]:not([data-card="IV"]) .card__plate img')].map((i) => ({ w: i.getBoundingClientRect().width, card: i.closest('[data-card]')!.getAttribute('data-card')! })),
      );
      const native: Record<string, number> = { I: 960, II: 900, III: 1280 };
      expect(plates).toHaveLength(3);
      for (const p of plates) {
        const id = p.card;
        expect(p.w * 2, `${id} plate at ${p.w}px`).toBeLessThanOrEqual(native[id]!);
      }

      // the H1 is in the first viewport
      const h1 = await page.locator('h1').boundingBox();
      expect(h1!.y).toBeLessThan(width < 768 ? 812 : 900);

      if (capture) {
        await page.screenshot({ path: path.join(SHOTS, `${st.name}-${width}.jpg`), fullPage: true, type: 'jpeg', quality: 72 });
      }
      await ctx.close();
    });
  }
