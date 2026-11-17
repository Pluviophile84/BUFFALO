// §13.8 Fonts: the intended faces render; no fallback ever draws Ƀ or ⟩.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PRE, ROOT } from '../helpers';

const fonts = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/fonts.json'), 'utf8'));

test('self-hosted faces load and are used (glyph-width check vs fallback)', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(PRE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(async () => {
    const faces = ['400 16px "Libre Caslon Display"', '400 16px "Libre Caslon Text"', 'italic 400 16px "Libre Caslon Text"', '700 16px "Libre Caslon Text"', '400 16px "JetBrains Mono"'];
    await Promise.all(faces.map((f) => document.fonts.load(f, 'BUFFALO|0'))); // force every face once
    const check = faces.map((f) => document.fonts.check(f, 'BUFFALO 0100 |'));
    const c = document.createElement('canvas').getContext('2d')!;
    const w = (font: string, s: string) => ((c.font = font), c.measureText(s).width);
    return {
      check,
      mono: w('40px "JetBrains Mono"', '|01000010'),
      monoFallback: w('40px monospace', '|01000010'),
      display: w('80px "Libre Caslon Display"', 'BUFFALO'),
      displayFallback: w('80px serif', 'BUFFALO'),
      loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.style} ${f.weight}`),
    };
  });
  expect(r.check).toEqual([true, true, true, true, true]);
  expect(r.mono).toBeCloseTo(9 * 0.6 * 40, 1); // JetBrains Mono advance is exactly 600/1000 em
  expect(Math.abs(r.mono - r.monoFallback)).toBeGreaterThan(0.5);
  expect(Math.abs(r.display - r.displayFallback)).toBeGreaterThan(1);
  for (const u of requests) expect(u.startsWith(PRE), `third-party request: ${u}`).toBe(true);
  expect(requests.filter((u) => /fonts\.googleapis|gstatic/.test(u))).toEqual([]);
});

test('Ƀ and ⟩ are never drawn by a font: SVG glyphs everywhere, text only for assistive tech', async ({ page }) => {
  await page.goto(PRE + '/');
  const offenders = await page.evaluate(() => {
    const out: string[] = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode as Text;
      if (/[Ƀ⟩]/.test(n.data) && !n.parentElement!.closest('.vh')) out.push(n.parentElement!.outerHTML.slice(0, 100));
    }
    return out;
  });
  expect(offenders).toEqual([]);
  // the ket lines end in the drawn bracket
  expect(await page.locator('.ket .glyph-ket').count()).toBe(1); // the Mark's decoder
  expect(await page.locator('svg.ket-line polyline').count()).toBe(1); // the footer ground line
  // and the shipped fonts genuinely lack both code points (if a font gains them, revisit Glyph.astro)
  expect(fonts.charset).not.toContain('Ƀ');
  expect(fonts.charset).not.toContain('⟩');
});

test('every rendered character is inside the subset (no silent fallback glyphs)', async ({ page }) => {
  await page.goto(PRE + '/');
  const chars = await page.evaluate(() => {
    const set = new Set<string>();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode as Text;
      const el = n.parentElement!;
      if (el.closest('.vh, script, style, noscript')) continue;
      for (const ch of n.data) if (!/\s/.test(ch)) set.add(ch);
    }
    return [...set];
  });
  const missing = chars.filter((c) => !fonts.charset.includes(c));
  expect(missing).toEqual([]);
});
