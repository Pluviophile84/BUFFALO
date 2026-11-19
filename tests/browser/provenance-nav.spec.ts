// Batch 3 part 7: the mobile Provenance scroller gets a visible counter (1 / 4) and
// ‹ › controls under the cards. Each moves exactly one card, keeping scroll-snap; they
// disable at the ends; the counter follows a swipe. Without JS the cards still swipe
// and the controls stay hidden. Two-dimensional layouts (≥ 768px) show none of it.
import { test, expect, type Page, type Browser } from '@playwright/test';
import { PRE } from '../helpers';

async function open(browser: Browser, width: number, opts: Record<string, unknown> = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 832 }, isMobile: width < 768, hasTouch: width < 768, reducedMotion: 'reduce', ...opts });
  const page = await ctx.newPage();
  await page.goto(PRE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    await document.fonts.ready;
    document.querySelector('#provenance')!.scrollIntoView();
  });
  await page.waitForTimeout(200);
  return { ctx, page };
}

/** Which card sits at the snap position (its left edge at the scroller's padding), or -1. */
const snapped = (page: Page) =>
  page.evaluate(() => {
    const sc = document.querySelector<HTMLElement>('.provenance__scroller')!;
    const pad = parseFloat(getComputedStyle(sc).scrollPaddingInlineStart) || 0;
    const x0 = sc.getBoundingClientRect().left + pad;
    const cards = [...sc.querySelectorAll('.card')].map((c) => c.getBoundingClientRect());
    const i = cards.findIndex((r) => Math.abs(r.left - x0) <= 2);
    const atEnd = Math.abs(sc.scrollLeft - (sc.scrollWidth - sc.clientWidth)) <= 2;
    const lastWhole = cards.at(-1)!.right <= sc.getBoundingClientRect().right + 1 && cards.at(-1)!.left >= sc.getBoundingClientRect().left - 1;
    return i >= 0 ? i : atEnd && lastWhole ? cards.length - 1 : -1;
  });

const ui = (page: Page) =>
  page.evaluate(() => ({
    count: document.querySelector('[data-cards-count]')!.textContent,
    sr: document.querySelector('[data-cards-count-sr]')!.textContent,
    prev: (document.querySelector('[data-cards-prev]') as HTMLButtonElement).disabled,
    next: (document.querySelector('[data-cards-next]') as HTMLButtonElement).disabled,
  }));

/** A touch swipe through the browser's input pipeline. */
async function swipe(page: Page, dx: number) {
  const box = (await page.locator('.provenance__scroller').boundingBox())!;
  const vh = page.viewportSize()!.height;
  const top = Math.max(box.y, 0);
  const at = { x: box.x + box.width / 2, y: top + (Math.min(box.y + box.height, vh) - top) / 2 }; // the visible part
  const cdp = await page.context().newCDPSession(page);
  const pt = (x: number, y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(at.x, at.y) });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(at.x + (dx * i) / 12, at.y) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

for (const width of [360, 384, 390]) {
  test(`‹ › move exactly one card, keep the snap, disable at the ends — ${width}px`, async ({ browser }) => {
    const { ctx, page } = await open(browser, width);
    const prev = page.getByRole('button', { name: 'Previous card' });
    const next = page.getByRole('button', { name: 'Next card' });
    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();
    for (const b of [prev, next]) {
      const bb = (await b.boundingBox())!;
      expect(bb.width).toBeGreaterThanOrEqual(44);
      expect(bb.height).toBeGreaterThanOrEqual(44);
    }
    // under the cards
    const below = await page.evaluate(() => document.querySelector('[data-cards-nav]')!.getBoundingClientRect().top >= document.querySelector('.provenance__cards')!.getBoundingClientRect().bottom - 1);
    expect(below).toBe(true);
    expect(await page.locator('.provenance__scroller').evaluate((e) => getComputedStyle(e).scrollSnapType)).toBe('x mandatory');
    expect(await ui(page)).toEqual({ count: '1 / 4', sr: 'Card 1 of 4.', prev: true, next: false });
    expect(await snapped(page)).toBe(0);
    for (const k of [1, 2, 3]) {
      await next.click();
      await expect.poll(() => snapped(page)).toBe(k);
      await expect.poll(() => ui(page).then((u) => u.count)).toBe(`${k + 1} / 4`);
    }
    expect(await ui(page)).toEqual({ count: '4 / 4', sr: 'Card 4 of 4.', prev: false, next: true });
    await next.click({ force: true }); // disabled: nothing moves
    expect(await snapped(page)).toBe(3);
    for (const k of [2, 1, 0]) {
      await prev.click();
      await expect.poll(() => snapped(page)).toBe(k);
      await expect.poll(() => ui(page).then((u) => u.count)).toBe(`${k + 1} / 4`);
    }
    expect((await ui(page)).prev).toBe(true);
    // the controls never scroll the page itself
    const y = await page.evaluate(() => scrollY);
    await next.click();
    await expect.poll(() => snapped(page)).toBe(1);
    expect(await page.evaluate(() => scrollY)).toBe(y);
    await ctx.close();
  });
}

test('the counter follows a swipe; the snap lands on a card', async ({ browser }) => {
  const { ctx, page } = await open(browser, 384);
  await swipe(page, -220);
  await expect.poll(() => snapped(page), { timeout: 4000 }).toBe(1);
  await expect.poll(() => ui(page)).toEqual({ count: '2 / 4', sr: 'Card 2 of 4.', prev: false, next: false });
  await swipe(page, -220);
  await expect.poll(() => snapped(page), { timeout: 4000 }).toBe(2);
  await expect.poll(() => ui(page).then((u) => u.count)).toBe('3 / 4');
  await swipe(page, 220);
  await expect.poll(() => snapped(page), { timeout: 4000 }).toBe(1);
  await expect.poll(() => ui(page).then((u) => u.count)).toBe('2 / 4');
  await ctx.close();
});

test('without JavaScript the cards still swipe and the controls are not shown', async ({ browser }) => {
  const { ctx, page } = await open(browser, 384, { javaScriptEnabled: false });
  await expect(page.locator('[data-cards-nav]')).toBeHidden();
  await expect(page.locator('.provenance__range')).toBeVisible(); // the old "I — IV" stays
  const sc = await page.locator('.provenance__scroller').evaluate((e) => ({ overflow: getComputedStyle(e).overflowX, snap: getComputedStyle(e).scrollSnapType, scrolls: e.scrollWidth > e.clientWidth }));
  expect(sc).toEqual({ overflow: 'auto', snap: 'x mandatory', scrolls: true });
  await ctx.close();
});

test('at 768px and wider (cards in a grid) there are no controls', async ({ browser }) => {
  for (const width of [768, 1440]) {
    const { ctx, page } = await open(browser, width);
    await expect(page.locator('[data-cards-nav]')).toBeHidden();
    await expect(page.locator('.provenance__progress')).toBeHidden();
    await ctx.close();
  }
});
