// §13.1 Logo integrity: the site's layered coin (Hero, Card IV, Mark), rendered
// at 1000px with every animation state final, vs. a resvg render of the master.
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PRE, ROOT, readPng, diffRatio } from '../helpers';

const ref = () => readPng(path.join(ROOT, 'tests/fixtures/master-1000.png'));
const outDir = path.join(ROOT, 'test-results/diffs');
fs.mkdirSync(outDir, { recursive: true });

// Render the coin IN PLACE: same DOM ancestry, same cascade, so any section rule
// that leaks into the emblem shows up here. Only size, position and visibility of
// everything else change.
async function isolate(page: Page, selector: string) {
  await page.evaluate(async (sel) => {
    document.querySelectorAll<HTMLElement>('section, footer').forEach((s) => (s.style.contentVisibility = 'visible'));
    const coin = document.querySelector<HTMLElement>(sel)!;
    Object.assign(coin.style, { position: 'fixed', left: '0px', top: '0px', width: '1000px', zIndex: '2147483647', visibility: 'visible' });
    coin.querySelectorAll<HTMLElement>('.hotspot').forEach((h) => (h.style.display = 'none'));
    // ask for the full-resolution source, as any 1000px layout would
    coin.querySelectorAll('source').forEach((s) => s.setAttribute('sizes', '1000px'));
    document.body.style.visibility = 'hidden';
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    await Promise.all([...coin.querySelectorAll('img')].map((i) => ((i.loading = 'eager'), i.decode().catch(() => {}))));
  }, selector);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(150);
}

const cases = [
  { name: 'hero (strike finished)', sel: '.hero__coin', motion: 'no-preference' as const, wait: 2600 },
  { name: 'hero (reduced motion)', sel: '.hero__coin', motion: 'reduce' as const, wait: 0 },
  { name: 'card IV', sel: '[data-card="IV"] .coin', motion: 'reduce' as const, wait: 0 },
  { name: 'the mark', sel: '#mark-coin', motion: 'reduce' as const, wait: 0 },
];

for (const c of cases) {
  test(`layered coin matches the master — ${c.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 1, reducedMotion: c.motion });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(c.wait);
    await isolate(page, c.sel);
    const shot = readPng(await page.screenshot({ clip: { x: 0, y: 0, width: 1000, height: 1000 }, omitBackground: true }));
    const ratio = diffRatio(shot, ref(), { out: path.join(outDir, `coin-${c.name.replace(/\W+/g, '-')}.png`) });
    fs.appendFileSync(path.join(outDir, 'coins.txt'), `${c.name}: ${(ratio * 100).toFixed(3)}%\n`);
    expect(ratio, `${c.name}: ${(ratio * 100).toFixed(3)}% differing`).toBeLessThan(0.005);
    await ctx.close();
  });
}

// Every emblem instance, at its natural size and in its real context: each raster
// layer sits exactly where the master's transforms put it.
for (const width of [375, 768, 1440]) {
  test(`layer geometry in situ, every coin @${width}`, async ({ browser }) => {
    const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/brand.json'), 'utf8'));
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelectorAll<HTMLElement>('section, footer').forEach((s) => (s.style.contentVisibility = 'visible')));
    const coins = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.coin')].map((c) => {
        const r = c.getBoundingClientRect();
        const rel = (sel: string) => {
          const b = c.querySelector(sel)!.getBoundingClientRect();
          return [(b.left - r.left) / r.width, (b.top - r.top) / r.height, b.width / r.width, b.height / r.height];
        };
        return { where: c.closest('section')!.id, size: r.width, aspect: r.width / r.height, bison: rel('.coin__bison'), bisonImg: rel('.coin__bison img'), ground: rel('.coin__ground'), b: rel('.coin__b'), rings: rel('.coin__rings'), guilloche: rel('.coin__guilloche') };
      }),
    );
    expect(coins).toHaveLength(3);
    const near = (got: number[], want: number[], size: number, label: string) =>
      got.forEach((v, i) => expect(Math.abs(v - want[i]!) * size, `${label}[${i}] off by ${(Math.abs(v - want[i]!) * size).toFixed(2)}px`).toBeLessThan(0.75));
    for (const c of coins) {
      expect(Math.abs(c.aspect - 1)).toBeLessThan(0.002);
      const p = (o: { left: number; top: number; width: number; height: number }) => [o.left / 100, o.top / 100, o.width / 100, o.height / 100];
      near(c.bison, p(brand.bison.percent), c.size, `${c.where} bison`);
      near(c.bisonImg, p(brand.bison.percent), c.size, `${c.where} bison img`);
      near(c.ground, p(brand.ground.percent), c.size, `${c.where} ground`);
      for (const k of ['b', 'rings', 'guilloche'] as const) near(c[k], [0, 0, 1, 1], c.size, `${c.where} ${k}`);
    }
    await ctx.close();
  });
}
