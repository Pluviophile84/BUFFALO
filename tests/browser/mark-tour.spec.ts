// Batch 3 part 6: the Mark as a guided tour wherever it is one column (< 1024px).
// One caption card directly under the coin replaces the list; item 1 is active at
// start; hotspots, ‹ › (wrapping), a horizontal swipe and the arrow keys change it;
// the hotspot (aria-pressed), the coin's layer highlight and the card always agree.
// Desktop (two columns) is unchanged. Without JavaScript the list stays.
import { test, expect, type Page, type Browser } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PRE } from '../helpers';

const IDS = ['rim', 'field', 'bison', 'guilloche', 'b', 'ground'];
const norm = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();

async function open(browser: Browser, width: number, height: number, opts: Record<string, unknown> = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 1024, hasTouch: width < 1024, reducedMotion: 'reduce', ...opts });
  const page = await ctx.newPage();
  await page.goto(PRE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    await document.fonts.ready;
  });
  return { ctx, page };
}

/** Scroll so the coin's top sits just below the sticky nav (sections above settle as they render). */
async function coinUnderNav(page: Page) {
  for (let k = 0; k < 8; k++) {
    const off = await page.evaluate(() => {
      const nav = document.querySelector('.nav')!.getBoundingClientRect().bottom;
      const c = document.querySelector('#mark-coin')!.getBoundingClientRect().top;
      scrollBy(0, c - (nav + 8));
      return Math.abs(c - (nav + 8));
    });
    await page.waitForTimeout(120);
    if (off < 1) break;
  }
}

const state = (page: Page) =>
  page.evaluate(() => {
    const live = document.querySelector('[data-tour-live]')!;
    return {
      count: document.querySelector('[data-tour-count]')!.textContent,
      title: live.querySelector('.tour__title')?.textContent ?? '',
      text: live.querySelector('.tour__text')?.textContent ?? '',
      active: (document.querySelector('[data-mark]') as HTMLElement).dataset.active ?? null,
      pressed: [...document.querySelectorAll<HTMLElement>('[data-spot][aria-pressed="true"]')].map((s) => s.dataset.spot),
    };
  });

/** The list's own title and text for an item: the card shows the same data. */
const listed = (page: Page, id: string) =>
  page.evaluate((id) => {
    const li = document.querySelector(`[data-item="${id}"]`)!;
    return { title: li.querySelector('.mark__title')!.textContent, text: li.querySelector('.mark__text')!.textContent };
  }, id);

const inView = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const nav = document.querySelector('.nav')!.getBoundingClientRect().bottom;
    const r = document.querySelector(sel)!.getBoundingClientRect();
    return r.top >= nav - 0.5 && r.bottom <= innerHeight + 0.5 && r.left >= -0.5 && r.right <= document.documentElement.clientWidth + 0.5;
  }, sel);

/** A real touch drag through the browser's input pipeline (honours touch-action). */
async function drag(page: Page, from: { x: number; y: number }, dx: number, dy: number) {
  const cdp = await page.context().newCDPSession(page);
  const pt = (x: number, y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from.x, from.y) });
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(from.x + (dx * i) / steps, from.y + (dy * i) / steps) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(200);
  await cdp.detach();
}

for (const [width, height] of [[384, 832], [768, 1024]] as const) {
  test.describe(`one column ${width}×${height}`, () => {
    test('the tour starts on item 1: list replaced by the card under the coin, region highlighted', async ({ browser }) => {
      const { ctx, page } = await open(browser, width, height);
      await expect(page.locator('[data-mark]')).toHaveClass(/mark--tour/);
      await expect(page.locator('.mark__list')).toBeHidden();
      const card = page.locator('[data-tour]');
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('role', 'region');
      await expect(card).toHaveAttribute('aria-live', 'polite');
      const s = await state(page);
      expect(s.count).toBe('01 / 06');
      expect(s.active).toBe('rim');
      expect(s.pressed).toEqual(['rim']);
      expect(norm(s.title)).toBe(norm((await listed(page, 'rim')).title));
      // directly under the coin; the ket decoder and the principle stay below it
      const g = await page.evaluate(() => {
        const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        return { coin: r('#mark-coin'), card: r('[data-tour]'), ket: r('[data-ket]'), principle: r('.mark__principle') };
      });
      expect(g.card.top - g.coin.bottom).toBeGreaterThanOrEqual(0);
      expect(g.card.top - g.coin.bottom).toBeLessThanOrEqual(32);
      expect(g.ket.top).toBeGreaterThan(g.card.bottom);
      expect(g.principle.top).toBeGreaterThan(g.ket.bottom);
      // nothing advances on its own
      await page.waitForTimeout(1500);
      expect((await state(page)).count).toBe('01 / 06');
      await ctx.close();
    });

    test('tapping each hotspot shows its title and text; the card and the hotspot are both on screen', async ({ browser }) => {
      const { ctx, page } = await open(browser, width, height);
      await coinUnderNav(page);
      for (const [i, id] of IDS.entries()) {
        await page.locator(`[data-spot="${id}"]`).tap();
        const s = await state(page);
        const want = await listed(page, id);
        expect(s.count).toBe(`0${i + 1} / 06`);
        expect(norm(s.title), id).toBe(norm(want.title));
        expect(norm(s.text), id).toBe(norm(want.text));
        expect(s.active).toBe(id);
        expect(s.pressed).toEqual([id]);
        expect(await inView(page, '[data-tour]'), `card in view (${id})`).toBe(true);
        expect(await inView(page, `[data-spot="${id}"]`), `hotspot in view (${id})`).toBe(true);
      }
      await ctx.close();
    });

    test('‹ › step through the items and wrap around; 44px targets, labelled', async ({ browser }) => {
      const { ctx, page } = await open(browser, width, height);
      const prev = page.getByRole('button', { name: 'Previous part' });
      const next = page.getByRole('button', { name: 'Next part' });
      for (const b of [prev, next]) {
        const bb = (await b.boundingBox())!;
        expect(bb.width).toBeGreaterThanOrEqual(44);
        expect(bb.height).toBeGreaterThanOrEqual(44);
      }
      await prev.click();
      expect((await state(page)).count).toBe('06 / 06'); // wraps back to the last
      expect((await state(page)).pressed).toEqual(['ground']);
      await next.click();
      expect((await state(page)).count).toBe('01 / 06'); // and forward to the first
      for (let k = 0; k < 6; k++) await next.click();
      expect((await state(page)).count).toBe('01 / 06');
      expect((await state(page)).active).toBe('rim');
      await ctx.close();
    });

    test('a horizontal swipe on the card advances; a vertical drag scrolls the page instead', async ({ browser }) => {
      const { ctx, page } = await open(browser, width, height);
      await coinUnderNav(page);
      const box = (await page.locator('.tour__stage').boundingBox())!;
      const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await drag(page, at, -120, 6); // finger moves left: next
      expect((await state(page)).count).toBe('02 / 06');
      await drag(page, at, 120, -4); // right: previous
      expect((await state(page)).count).toBe('01 / 06');
      await drag(page, at, -24, 0); // under 40px: nothing
      expect((await state(page)).count).toBe('01 / 06');
      const y0 = await page.evaluate(() => scrollY);
      await drag(page, at, 8, -220); // mostly vertical: the page scrolls, the item stays
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y0 + 100);
      expect((await state(page)).count).toBe('01 / 06');
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-tour]')!).touchAction)).toBe('pan-y');
      await ctx.close();
    });

    test('arrow keys on the card and on the hotspots change the item, in sync', async ({ browser }) => {
      const { ctx, page } = await open(browser, width, height);
      await page.getByRole('button', { name: 'Next part' }).focus();
      await page.keyboard.press('ArrowRight');
      expect((await state(page)).count).toBe('02 / 06');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      expect((await state(page)).count).toBe('06 / 06');
      await page.keyboard.press('Home');
      expect((await state(page)).count).toBe('01 / 06');
      // hotspots: the active one is in the tab order; arrows move focus and the card
      await page.locator('[data-spot="rim"]').focus();
      await page.keyboard.press('ArrowRight');
      expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.spot)).toBe('field');
      const s = await state(page);
      expect([s.count, s.active, s.pressed]).toEqual(['02 / 06', 'field', ['field']]);
      expect(await page.locator('[data-spot][tabindex="0"]').evaluate((e) => (e as HTMLElement).dataset.spot)).toBe('field');
      await ctx.close();
    });

    test('no layout shift when switching: the card keeps the tallest item’s height', async ({ browser }) => {
      const { ctx, page } = await open(browser, width, height);
      await coinUnderNav(page);
      await page.evaluate(() => {
        (window as unknown as { __ls: number }).__ls = 0;
        new PerformanceObserver((l) => l.getEntries().forEach((e) => ((window as unknown as { __ls: number }).__ls += (e as unknown as { value: number }).value))).observe({ type: 'layout-shift' });
      });
      const geo = () => page.evaluate(() => ({ card: document.querySelector('[data-tour]')!.getBoundingClientRect().height, ket: document.querySelector('[data-ket]')!.getBoundingClientRect().top + scrollY }));
      const g0 = await geo();
      for (let k = 0; k < 6; k++) {
        await page.getByRole('button', { name: 'Next part' }).click();
        const g = await geo();
        expect(Math.abs(g.card - g0.card)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(g.ket - g0.ket)).toBeLessThanOrEqual(0.5);
      }
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => (window as unknown as { __ls: number }).__ls)).toBe(0);
      // the card is exactly as tall as its tallest item
      const fit = await page.evaluate(() => {
        const sizes = [...document.querySelectorAll('[data-tour-size]')].map((e) => e.getBoundingClientRect().height);
        return { tallest: Math.max(...sizes), stage: document.querySelector('.tour__stage')!.getBoundingClientRect().height };
      });
      expect(Math.abs(fit.stage - fit.tallest)).toBeLessThanOrEqual(0.5);
      await ctx.close();
    });

    test('axe is clean with the tour running', async ({ browser }) => {
      const { ctx, page } = await open(browser, width, height);
      await coinUnderNav(page);
      await page.getByRole('button', { name: 'Next part' }).click();
      const res = await new AxeBuilder({ page }).include('#mark').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      const v = res.violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
      expect(v, v.join('\n')).toEqual([]);
      await ctx.close();
    });
  });
}

test('at 384×832 the whole card fits once the coin sits just below the nav', async ({ browser }) => {
  const { ctx, page } = await open(browser, 384, 832);
  await coinUnderNav(page);
  expect(await inView(page, '#mark-coin')).toBe(true);
  expect(await inView(page, '[data-tour]')).toBe(true);
  const w = await page.locator('#mark-coin').evaluate((e) => e.getBoundingClientRect().width);
  expect(w).toBeGreaterThanOrEqual(0.64 * 384);
  await ctx.close();
});

test('without JavaScript the full list stays and the card never shows', async ({ browser }) => {
  const { ctx, page } = await open(browser, 384, 832, { javaScriptEnabled: false });
  await expect(page.locator('[data-tour]')).toBeHidden();
  await expect(page.locator('.mark__list')).toBeVisible();
  await expect(page.locator('.mark__item')).toHaveCount(6);
  await expect(page.locator('[data-mark]')).not.toHaveClass(/mark--tour/);
  await ctx.close();
});

test('1440×900 (two columns) is unchanged: list beside the coin, no card, nothing pinned until clicked', async ({ browser }) => {
  const { ctx, page } = await open(browser, 1440, 900);
  await expect(page.locator('[data-mark]')).not.toHaveClass(/mark--tour/);
  await expect(page.locator('[data-tour]')).toBeHidden();
  await expect(page.locator('.mark__list')).toBeVisible();
  expect(await page.locator('[data-spot][aria-pressed="true"]').count()).toBe(0);
  expect(await page.evaluate(() => (document.querySelector('[data-mark]') as HTMLElement).dataset.active ?? null)).toBeNull();
  const g = await page.evaluate(() => {
    const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
    return { coin: r('.mark__coinwrap'), notes: r('.mark__notes') };
  });
  expect(g.notes.left).toBeGreaterThan(g.coin.right); // side by side
  // click pins, a second click unpins (as before)
  await page.locator('[data-pick="bison"]').click();
  await expect(page.locator('[data-spot="bison"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-pick="bison"]').click();
  await expect(page.locator('[data-spot="bison"]')).toHaveAttribute('aria-pressed', 'false');
  await ctx.close();
});
