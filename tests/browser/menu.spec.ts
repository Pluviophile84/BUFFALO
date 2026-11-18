// Fix 3: opening and closing the menu never moves the page.
//
// Root cause (first version): closing the menu returned focus to the toggle with a
// plain focus(). The toggle sits in the sticky nav, inside html's 88px
// scroll-padding band, so the browser treated it as obscured and scrolled the page
// about half a viewport on every close. Opening also removed the classic scrollbar
// (overflow: hidden), so the page reflowed 15px wider and back.
//
// Classic (space-taking) scrollbars, as on desktop Windows and Linux: headless
// Chromium hides them by default, which would hide the scrollbar half of the bug.
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PRE, ROOT } from '../helpers';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

const SIZES = [
  [1440, 900],
  [390, 844],
  [900, 900], // toggle visible with a desktop scrollbar (the toggle shows below 1100px)
] as const;
const POSITIONS = { top: 0, middle: 0.5, 'near the bottom': 0.95 } as const;

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/** Sum of layout-shift scores from now on (inputs included: a toggle must cause none). */
async function watchShifts(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __shift: number; __shiftSrc: string[] };
    w.__shift = 0;
    w.__shiftSrc = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; sources?: { node?: Node }[] })[]) {
        w.__shift += e.value;
        w.__shiftSrc.push(`${e.value.toFixed(5)} ${(e.sources ?? []).map((s) => (s.node as Element | undefined)?.className || s.node?.nodeName).join(',')}`);
      }
    }).observe({ type: 'layout-shift', buffered: false });
  });
  return () =>
    page.evaluate(() => {
      const w = window as unknown as { __shift: number; __shiftSrc: string[] };
      return { score: w.__shift, sources: w.__shiftSrc };
    });
}

for (const [width, height] of SIZES)
  for (const [where, at] of Object.entries(POSITIONS))
    test(`menu toggled 10× leaves scrollY exactly unchanged and causes no layout shift — ${width}×${height}, ${where}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height } });
      const page = await ctx.newPage();
      await page.goto(PRE + '/', { waitUntil: 'networkidle' });
      await page.evaluate((at) => window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) * at), behavior: 'instant' }), at);
      await page.waitForTimeout(800); // lazy content near the new position settles first
      await settle(page);
      const toggleVisible = await page.locator('[data-menu-open]').isVisible();
      // At >= 1100px the toggle is hidden (the nav links show instead); the same
      // open/close handlers are driven through the buttons' own click().
      const press = async (sel: string) => {
        if (toggleVisible) {
          const b = (await page.locator(sel).boundingBox())!;
          await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
        } else await page.evaluate((sel) => (document.querySelector(sel) as HTMLButtonElement).click(), sel);
      };
      const y0 = await page.evaluate(() => scrollY);
      const navH = await page.evaluate(() => document.querySelector('.nav')!.getBoundingClientRect().height);
      const shifts = await watchShifts(page);
      for (let i = 0; i < 10; i++) {
        await press('[data-menu-open]');
        await expect(page.locator('#menu')).toBeVisible();
        await page.waitForTimeout(150);
        expect(await page.evaluate(() => document.querySelector('.nav')!.getBoundingClientRect().height)).toBe(navH);
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).toBe('hidden');
        await press('[data-menu-close]');
        await expect(page.locator('#menu')).toBeHidden();
        await page.waitForTimeout(350); // a smooth scroll, if any, would be under way
        await settle(page);
        expect(await page.evaluate(() => scrollY), `toggle ${i + 1}`).toBe(y0);
        expect(await page.evaluate(() => document.querySelector('.nav')!.getBoundingClientRect().height)).toBe(navH);
      }
      // focus returned to the toggle (where it is shown; at >= 1100px it is display:none)
      if (toggleVisible) expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-open'))).toBe(true);
      await page.waitForTimeout(300);
      const s = await shifts();
      expect(s.score, s.sources.join(' | ')).toBe(0);
      await ctx.close();
    });

for (const [width, height] of [[390, 844], [900, 900]] as const)
  test(`keyboard only: Tab onto the toggle, open, Tab around the menu, Esc — the page never moves — ${width}×${height}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) / 2), behavior: 'instant' }));
    await page.waitForTimeout(800);
    const y0 = await page.evaluate(() => scrollY);
    const y = async () => {
      await page.waitForTimeout(350);
      return (await page.evaluate(() => scrollY)) - y0;
    };
    // focusing anything in the sticky nav (as Tab does) must not scroll
    await page.evaluate(() => (document.querySelector('.nav .wordmark') as HTMLElement).focus());
    expect(await y()).toBe(0);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-open'))).toBe(true);
    expect(await y()).toBe(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('#menu')).toBeVisible();
    expect(await page.evaluate(() => !!document.activeElement?.closest('#menu'))).toBe(true);
    expect(await page.evaluate(() => [...document.body.children].filter((el) => el.id !== 'menu' && el.tagName !== 'SCRIPT').every((el) => (el as HTMLElement).inert))).toBe(true);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i % 4 === 3 ? 'Shift+Tab' : 'Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('#menu'))).toBe(true); // trapped
    }
    expect(await y()).toBe(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu')).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-open'))).toBe(true);
    expect(await page.evaluate(() => [...document.body.children].some((el) => (el as HTMLElement).inert))).toBe(false);
    expect(await y()).toBe(0);
    await ctx.close();
  });

test('scroll lock: overflow:hidden on <html> only, stable gutter, no fixed body, no scrollTo, preventScroll on every focus', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(PRE + '/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter)).toBe('stable');
  await page.locator('[data-menu-open]').click();
  const open = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).overflowY,
    body: { overflow: getComputedStyle(document.body).overflowY, position: getComputedStyle(document.body).position, top: document.body.style.top },
  }));
  expect(open).toEqual({ html: 'hidden', body: { overflow: 'visible', position: 'static', top: '' } });
  await ctx.close();
  const src = fs.readFileSync(path.join(ROOT, 'src/scripts/nav.ts'), 'utf8').replace(/\/\/.*$/gm, '');
  expect(src).not.toMatch(/scrollTo|scrollBy|scrollIntoView|position\s*=\s*['"]fixed/);
  const focusCalls = src.match(/\.focus\([^)]*\)/g) ?? [];
  expect(focusCalls.length).toBeGreaterThan(0);
  for (const c of focusCalls) expect(c).toBe('.focus({ preventScroll: true })');
});
