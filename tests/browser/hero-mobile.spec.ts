// Batch 3 part 5: the hero's actions, and the mobile first screen.
//
// Pre-issue: one action, "Read the provenance" (primary, → #provenance); no disabled
// button (the serial module and the specimen stamp say the issue is pending); no CTA in
// the mobile menu. Live: "Buy on pump.fun" (or "Buy $BUFFALO" on another buy route) →
// buyUrl, then "Verify mint address" → explorerUrl; the menu CTA repeats the primary.
//
// First screen: at 384×832 the H1, the sub and the primary action are fully visible
// below the sticky nav; at 375×667 the H1 and the sub. The coin stays centred and never
// goes below 64vw.
import { test, expect, type Page } from '@playwright/test';
import { PRE, LIVE, LIVE_CONTRACT } from '../helpers';

async function open(browser: import('@playwright/test').Browser, base: string, width: number, height: number) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}

const boxes = (page: Page, sels: string[]) =>
  page.evaluate((sels) => {
    const nav = document.querySelector('.nav')!.getBoundingClientRect().bottom;
    const coin = document.querySelector('.hero__coin')!.getBoundingClientRect();
    return {
      nav,
      vh: innerHeight,
      vw: document.documentElement.clientWidth,
      coin: { w: coin.width, cx: coin.left + coin.width / 2 },
      els: sels.map((s) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return { s, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      }),
    };
  }, sels);

for (const [state, base] of [['pre-issue', PRE], ['live', LIVE]] as const)
  for (const [width, height, sels] of [
    [384, 832, ['.hero__h1', '.hero__sub', '.hero__actions .btn--primary']],
    [375, 667, ['.hero__h1', '.hero__sub']],
  ] as const)
    test(`first screen ${width}×${height} (${state}): ${sels.length === 3 ? 'H1, sub and primary action' : 'H1 and sub'} fully visible; coin centred, ≥ 64vw`, async ({ browser }) => {
      const { ctx, page } = await open(browser, base, width, height);
      const m = await boxes(page, [...sels]);
      for (const e of m.els) {
        expect(e.top, `${e.s} top`).toBeGreaterThanOrEqual(m.nav); // below the sticky nav
        expect(e.bottom, `${e.s} bottom`).toBeLessThanOrEqual(m.vh);
        expect(e.left, `${e.s} left`).toBeGreaterThanOrEqual(0);
        expect(e.right, `${e.s} right`).toBeLessThanOrEqual(m.vw);
      }
      expect(m.coin.w).toBeGreaterThanOrEqual(0.64 * width - 0.5);
      expect(Math.abs(m.coin.cx - m.vw / 2)).toBeLessThanOrEqual(1);
      await ctx.close();
    });

test('pre-issue hero: no disabled button; the primary action reads the provenance; no menu CTA', async ({ browser }) => {
  const { ctx, page } = await open(browser, PRE, 384, 832);
  // no disabled action (the serial module's Copy stays disabled until issue, as before)
  await expect(page.locator('.hero a[aria-disabled], .hero__actions [aria-disabled], .hero__actions :disabled, .hero .helper')).toHaveCount(0);
  await expect(page.locator('.hero [aria-disabled]')).toHaveCount(1);
  await expect(page.locator('.hero [aria-disabled]')).toHaveClass(/serial__copy/);
  const actions = page.locator('.hero__actions .btn');
  await expect(actions).toHaveCount(1);
  await expect(actions.first()).toHaveText('Read the provenance');
  await expect(actions.first()).toHaveClass(/btn--primary/);
  await expect(actions.first()).toHaveAttribute('href', '#provenance');
  await page.locator('[data-menu-open]').click();
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#menu .menu__foot a, #menu .menu__foot .btn')).toHaveCount(0);
  await ctx.close();
});

test('live hero: Buy on pump.fun → the buy route, Verify mint address → the explorer; the menu CTA matches', async ({ browser }) => {
  const { ctx, page } = await open(browser, LIVE, 384, 832);
  const primary = page.locator('.hero__actions .btn--primary');
  await expect(primary).toHaveText('Buy on pump.fun');
  await expect(primary).toHaveAttribute('href', `https://pump.fun/coin/${LIVE_CONTRACT}`);
  await expect(primary).toHaveAttribute('target', '_blank');
  await expect(primary).toHaveAttribute('rel', 'noopener noreferrer');
  const secondary = page.locator('.hero__actions .btn:not(.btn--primary)');
  await expect(secondary).toHaveCount(1);
  await expect(secondary).toHaveText('Verify mint address');
  await expect(secondary).toHaveAttribute('href', `https://solscan.io/token/${LIVE_CONTRACT}`);
  await expect(secondary).toHaveAttribute('rel', 'noopener noreferrer');
  await page.locator('[data-menu-open]').click();
  const cta = page.locator('#menu .menu__foot a.btn');
  await expect(cta).toHaveCount(1);
  await expect(cta).toHaveText('Buy on pump.fun');
  await expect(cta).toHaveAttribute('href', `https://pump.fun/coin/${LIVE_CONTRACT}`);
  await expect(cta).toHaveClass(/btn--primary/);
  await ctx.close();
});
