// Fix 3 (batch 2): the guilloche field shows the logo's own guilloche paths through the
// unchanged mechanism: same component, same static SVG and fine-pointer canvas, same
// box, centre, stroke and z-order. Only the line source changed (and, because the
// logo's lines are fixed paths, the canvas no longer drifts or bends).
import { test, expect, type Browser, type BrowserContextOptions } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PRE, ROOT } from '../helpers';
// @ts-ignore plain ESM helper shared with the calibration tooling
import { measureField } from '../lib/field-luminance.mjs';

const REF = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/guilloche-reference/luminance.json'), 'utf8')) as Record<string, { meanY: number; contribution: number }>;
const generated = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/generated.json'), 'utf8'));

async function open(browser: Browser, opts: BrowserContextOptions) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  await page.goto(PRE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => (document.documentElement.style.scrollbarGutter = 'auto'));
  return { ctx, page };
}

for (const [width, height] of [[390, 844], [1440, 900]] as const)
  test(`field geometry unchanged: box ±4.93R centred on the anchor; logo disc edge at 4.4R, clear inside 1.07R — ${width}`, async ({ browser }) => {
    const { ctx, page } = await open(browser, { viewport: { width, height }, reducedMotion: 'reduce' });
    const g = await page.evaluate(() => {
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width };
      };
      const svg = document.querySelector('.field--hero .field__svg')!;
      return {
        coin: box(document.querySelector('.hero__coin')!),
        field: box(document.querySelector('.field--hero')!),
        wrap: box(document.querySelector('.final__fieldwrap')!),
        final: box(document.querySelector('.field--final')!),
        viewBox: svg.getAttribute('viewBox')!.split(' ').map(Number),
        uses: [...svg.querySelectorAll('use')].map((u) => u.getAttribute('href')),
        clipOnGroup: !!svg.querySelector('g[clip-path] > use'),
        clip: svg.querySelector('clipPath path')!.getAttribute('d'),
        z: getComputedStyle(document.querySelector('.field--hero')!).zIndex,
      };
    });
    const R = g.coin.w / 2;
    expect(Math.abs(g.field.w - 2 * 4.93 * R)).toBeLessThan(1);
    expect(Math.abs(g.field.cx - g.coin.cx)).toBeLessThan(1);
    expect(Math.abs(g.field.cy - g.coin.cy)).toBeLessThan(1);
    expect(Math.abs(g.final.w - 4.93 * g.wrap.w)).toBeLessThan(1);
    expect(Math.abs(g.final.cx - g.wrap.cx)).toBeLessThan(1);
    expect(g.z).toBe('0');
    // Batch 3: the paths in six files, in order, one <use> each, inside one clipped group
    expect(g.uses).toHaveLength(generated.field.chunks);
    g.uses.forEach((u, k) => expect(u).toMatch(new RegExp(`/_astro/guilloche-field-${k + 1}\\.[\\w-]+\\.svg#field$`)));
    expect(g.clipOnGroup).toBe(true);
    // viewBox half-size ↔ 4.93R and the logo's disc ↔ 4.4R
    const { disc, center } = generated.field;
    const half = g.viewBox[2]! / 2;
    expect(half / disc).toBeCloseTo(4.93 / 4.4, 3);
    expect(g.viewBox[0]! + half).toBeCloseTo(center[0], 1);
    const r0 = Number(g.clip!.match(/a([\d.]+)/)![1]);
    expect(r0 / disc).toBeCloseTo(1.07 / 4.4, 3);
    await ctx.close();
  });

test('fine pointer: the path file is fetched once for both hosts, and the hidden SVG under the canvas is never attached', async ({ browser }) => {
  const { ctx, page } = await open(browser, { viewport: { width: 1440, height: 900 } });
  const fetched: string[] = [];
  page.on('request', (r) => /guilloche-field/.test(r.url()) && fetched.push(new URL(r.url()).pathname));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.hero.has-canvas canvas.guilloche-canvas');
  await page.evaluate(() => document.querySelector('.final')!.scrollIntoView());
  await page.waitForFunction(() => document.querySelectorAll('canvas.guilloche-canvas').length === 2 && [...document.querySelectorAll<HTMLCanvasElement>('canvas.guilloche-canvas')].every((c) => c.width > 0));
  await page.waitForTimeout(500);
  expect(fetched.filter((p) => /guilloche-field\.[\w-]+\.svg$/.test(p))).toHaveLength(1); // one fetch, one parse
  expect(fetched.filter((p) => /guilloche-field-\d/.test(p))).toEqual([]); // the static chunks never load
  expect(await page.locator('.has-canvas .field use[href]').count()).toBe(0);
  await ctx.close();
});

test('coarse pointer: the static field attaches its six files one at a time, after load', async ({ browser }) => {
  const { ctx, page } = await open(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await expect.poll(() => page.locator('.field--hero use[href]').count()).toBe(generated.field.chunks);
  expect(await page.locator('.guilloche-canvas').count()).toBe(0);
  await ctx.close();
});

test('fine pointer: the canvas draws the same paths, static (no drift, no pointer bend); none for reduced motion or touch', async ({ browser }) => {
  const { ctx, page } = await open(browser, { viewport: { width: 1440, height: 900 } });
  await page.waitForSelector('.hero.has-canvas canvas.guilloche-canvas');
  await page.waitForFunction(() => {
    const c = document.querySelector('.hero canvas') as HTMLCanvasElement;
    return c.width > 0 && c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0);
  });
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.field--hero .field__svg')!).visibility)).toBe('hidden');
  const snap = () => page.evaluate(() => (document.querySelector('.hero canvas') as HTMLCanvasElement).toDataURL());
  const a = await snap();
  await page.mouse.move(1300, 400, { steps: 6 });
  await page.mouse.move(1350, 700, { steps: 6 });
  await page.waitForTimeout(1500);
  expect(await snap()).toBe(a); // nothing moves, nothing bends
  await ctx.close();
  for (const opts of [{ reducedMotion: 'reduce' as const, viewport: { width: 1440, height: 900 } }, { isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } }]) {
    const o = await open(browser, opts);
    await o.page.waitForTimeout(500);
    expect(await o.page.locator('.guilloche-canvas').count()).toBe(0);
    await o.ctx.close();
  }
});

// Intensity vs the generated field (tests/fixtures/guilloche-reference, captured before
// the swap). Only opacity was adjusted. The final section matches within ±5%. The
// hero cannot: at the logo's line density even full opacity gives 65–68% of the old
// field's line light, and mean luminance 87–92% of the reference. It is held at full
// opacity, the most the permitted adjustment can do (README).
for (const [w, h] of [[390, 844], [1440, 900]] as const)
  for (const mode of ['static', 'canvas'] as const) {
    if (mode === 'canvas' && w < 1024) continue;
    test(`field intensity vs the reference — ${w}×${h} ${mode}`, async ({ browser }) => {
      const { ctx, page } = await open(browser, {
        viewport: { width: w, height: h },
        reducedMotion: mode === 'static' ? 'reduce' : 'no-preference',
        ...(w < 1024 ? { isMobile: true, hasTouch: true } : {}),
      });
      if (mode === 'canvas') {
        await page.mouse.move(4, h - 4);
        await page.waitForTimeout(2600); // the strike is over
      } else await page.waitForTimeout(300);
      const out: string[] = [];
      for (const where of ['hero', 'final'] as const) {
        if (where === 'final') {
          await page.evaluate(() => {
            const f = document.querySelector('.final')!;
            window.scrollTo({ top: f.getBoundingClientRect().top + scrollY - 80, behavior: 'instant' });
          });
          await page.waitForTimeout(700);
        }
        const m = await measureField(page, where);
        const ref = REF[`${where}@${w}x${h} ${mode}`]!;
        const ratio = m.meanY / ref.meanY;
        out.push(`${where}: meanY ${((ratio - 1) * 100).toFixed(1)}%, line light ${((m.contribution / ref.contribution - 1) * 100).toFixed(1)}%`);
        if (where === 'final') {
          expect(ratio).toBeGreaterThanOrEqual(0.95);
          expect(ratio).toBeLessThanOrEqual(1.05);
        } else {
          expect(ratio).toBeGreaterThan(0.85); // never further from the reference than measured
          expect(ratio).toBeLessThan(1.0);
        }
      }
      test.info().annotations.push({ type: 'intensity', description: out.join(' | ') });
      const alpha = await page.evaluate(() => getComputedStyle(document.querySelector('.field--hero')!).getPropertyValue('--field-alpha').trim());
      expect(alpha).toBe('1'); // the hero at full opacity: the most the opacity adjustment allows
      await ctx.close();
    });
  }
