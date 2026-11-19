// Fix 2 (batch 2): the Ƀ in the Statement of Issue seal is centred in its ring.
//
// Cause: the Ƀ was already the extracted vector with a tight viewBox, but it sat
// inside the inline glyph wrapper used in running text: an inline-block span on
// the text baseline, 23px tall (the label's line box: the 18px glyph plus the
// font's descent). The ring centred that span, so the Ƀ rode 2.5px above the
// ring's centre. It is now its own block, centred by its bounding box.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PRE, ROOT } from '../helpers';

const bSymbol = fs.readFileSync(path.join(ROOT, 'tests/fixtures/layers/b-symbol.svg'), 'utf8');

for (const width of [375, 768, 1440, 1920])
  test(`Statement seal: the Ƀ's bounding-box centre is the ring's centre (±0.5px) — ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('.statement__sig')!.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const m = await page.evaluate(() => {
      const seal = document.querySelector('.statement__sig .seal')!;
      const ring = seal.getBoundingClientRect();
      const svg = seal.querySelector('svg')!;
      const p = svg.querySelector('path')!;
      const bb = p.getBBox(); // the path's own bounding box, in its user units
      const ctm = p.getScreenCTM()!;
      const a = new DOMPoint(bb.x, bb.y).matrixTransform(ctm);
      const b = new DOMPoint(bb.x + bb.width, bb.y + bb.height).matrixTransform(ctm);
      return {
        ring: { cx: ring.left + ring.width / 2, cy: ring.top + ring.height / 2, w: ring.width, h: ring.height, radius: getComputedStyle(seal).borderRadius },
        b: { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, h: b.y - a.y },
        d: p.getAttribute('d'),
        viewBox: svg.getAttribute('viewBox'),
        bbox: [bb.x, bb.y, bb.width, bb.height],
        text: !!seal.querySelector('text') || seal.textContent!.trim().length > 0,
      };
    });
    expect(Math.abs(m.b.cx - m.ring.cx), 'x').toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.b.cy - m.ring.cy), 'y').toBeLessThanOrEqual(0.5);
    // sizes kept: a 40px ring, an 18px-tall Ƀ
    expect([m.ring.w, m.ring.h, m.ring.radius]).toEqual([40, 40, '50%']);
    expect(m.b.h).toBeCloseTo(18, 1);
    // the extracted vector (b-symbol.svg), not a font glyph; viewBox tight to the path
    expect(m.text).toBe(false);
    expect(bSymbol).toContain(`d="${m.d}"`);
    expect(bSymbol).toContain(`viewBox="${m.viewBox}"`);
    const vb = m.viewBox!.split(' ').map(Number);
    m.bbox.forEach((v, i) => expect(Math.abs(v - vb[i]!)).toBeLessThan(0.01));
    await ctx.close();
  });
