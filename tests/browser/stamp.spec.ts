// Fix 1 (batch 2): the SPECIMEN · PRE-ISSUE stamp always contains its text, with
// equal space left and right.
//
// Cause: below 1024px the stamp is capped at half the column minus 16px (it must
// stay left of the security thread), but it was one `white-space: nowrap` line of
// 15.2em (20 monospaced characters at 0.6em advance + 0.16em letter-spacing) plus
// 28px of padding and border: wider than the cap on every phone, so the text ran
// out of the box on the right (14px at 320, 6px at 390). Its 12/10px padding also
// only approximated the trailing letter-spacing.
import { test, expect } from '@playwright/test';
import { PRE } from '../helpers';

/** Ink box of the stamp's text: line boxes minus each line's trailing letter-spacing. */
const measure = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const s = document.querySelector<HTMLElement>('.hero__stamp')!;
    const cs = getComputedStyle(s);
    const box = s.getBoundingClientRect();
    const bw = parseFloat(cs.borderLeftWidth);
    const ls = parseFloat(cs.letterSpacing);
    const shown = (el: Element) => getComputedStyle(el).display !== 'none' && (!el.parentElement || getComputedStyle(el.parentElement).display !== 'none');
    const lines = [...s.querySelectorAll<HTMLElement>('.stamp__one, .stamp__line')].filter(shown);
    // text nodes only (a block-level line's own box spans the whole content width)
    const rects: DOMRect[] = [];
    const walk = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!(n.parentElement as Element).checkVisibility()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      rects.push(...[...range.getClientRects()].filter((r) => r.width > 0.5));
    }
    const text = { left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)) - ls, top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)) };
    const thread = document.querySelector('.hero__coincol .thread')!.getBoundingClientRect();
    return {
      box: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
      inner: { left: box.left + bw, right: box.right - bw, top: box.top + bw, bottom: box.bottom - bw },
      text,
      lineCount: new Set(rects.map((r) => Math.round(r.top))).size,
      visibleParts: lines.map((el) => el.textContent),
      threadLeft: thread.left,
      content: s.querySelector('.stamp__one')!.textContent,
    };
  });

for (const width of [320, 360, 375, 390, 414, 430])
  test(`stamp: text inside its box, equal side spacing — ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const m = await measure(page);
    // fully inside the box (its inner edge, inside the double border)
    expect(m.text.left).toBeGreaterThanOrEqual(m.inner.left);
    expect(m.text.right).toBeLessThanOrEqual(m.inner.right);
    expect(m.text.top).toBeGreaterThanOrEqual(m.inner.top - 0.5);
    expect(m.text.bottom).toBeLessThanOrEqual(m.inner.bottom + 0.5);
    // optically centred: left and right inner spacing within 1px
    const left = m.text.left - m.inner.left;
    const right = m.inner.right - m.text.right;
    expect(Math.abs(left - right), `left ${left.toFixed(2)} right ${right.toFixed(2)}`).toBeLessThanOrEqual(1);
    // two lines, SPECIMEN / PRE-ISSUE; the whole stamp still clear of the thread
    expect(m.lineCount).toBe(2);
    expect(m.visibleParts).toEqual(['SPECIMEN', 'PRE-ISSUE']);
    expect(m.content).toBe('SPECIMEN · PRE-ISSUE');
    expect(m.box.right).toBeLessThanOrEqual(m.threadLeft);
    await ctx.close();
  });

for (const width of [768, 1440])
  test(`stamp: one line from 480px up, as before — ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const m = await measure(page);
    expect(m.lineCount).toBe(1);
    expect(m.visibleParts).toEqual(['SPECIMEN · PRE-ISSUE']); // the original text node
    expect(m.text.left).toBeGreaterThanOrEqual(m.inner.left);
    expect(m.text.right).toBeLessThanOrEqual(m.inner.right);
    expect(m.text.left - m.inner.left).toBeCloseTo(12, 1); // padding 12px / 10px, unchanged
    await ctx.close();
  });
