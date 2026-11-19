// Batch 3 part 8: the mobile header navigates without JavaScript, whether it is turned
// off or the script is blocked. A native <details> holds the section links; the script
// removes it first thing, so with JavaScript the overlay menu is exactly as before
// (tests/browser/menu.spec.ts still covers it: focus trap, Esc, inert, scroll position).
import { test, expect, type Browser, type BrowserContextOptions } from '@playwright/test';
import { PRE } from '../helpers';

const LINKS = ['Provenance', 'Character', 'The Mark', 'Specification', 'Acquire', 'Custodians'];

async function open(browser: Browser, opts: BrowserContextOptions, block = false) {
  const ctx = await browser.newContext({ viewport: { width: 384, height: 832 }, isMobile: true, hasTouch: true, ...opts });
  const page = await ctx.newPage();
  if (block) await page.route('**/_astro/*.js', (r) => r.abort()); // JS on, but the script never arrives
  await page.goto(PRE + '/', { waitUntil: 'load' });
  return { ctx, page };
}

for (const mode of ['disabled', 'blocked'] as const)
  test(`JavaScript ${mode}: the header's Menu opens the section links, and they navigate`, async ({ browser }) => {
    const { ctx, page } = await open(browser, mode === 'disabled' ? { javaScriptEnabled: false } : {}, mode === 'blocked');
    await expect(page.locator('[data-menu-open]')).toBeHidden(); // the overlay needs the script
    const summary = page.locator('.nav [data-nav-fallback] > summary');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText(/^menu$/i, { useInnerText: true }); // set in capitals by CSS
    await expect(summary).toHaveAccessibleName('Menu');
    const bb = (await summary.boundingBox())!;
    expect(bb.height).toBeGreaterThanOrEqual(44);
    const links = page.locator('.nav__fallback-links a');
    await expect(links.first()).toBeHidden();
    await summary.click();
    await expect(summary).toHaveText(/^close$/i, { useInnerText: true });
    await expect(summary).toHaveAccessibleName('Close');
    await expect(links).toHaveText(LINKS);
    for (const a of await links.all()) {
      await expect(a).toBeVisible();
      expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.locator('.nav__fallback-links a', { hasText: 'Specification' }).click();
    await expect(page).toHaveURL(/#specification$/);
    await expect.poll(() => page.evaluate(() => Math.round(document.querySelector('#specification')!.getBoundingClientRect().top))).toBeLessThan(400);
    await summary.click(); // closes again
    await expect(links.first()).toBeHidden();
    await ctx.close();
  });

test('with JavaScript the fallback is gone and the Menu button sits in exactly its place', async ({ browser }) => {
  const nojs = await open(browser, { javaScriptEnabled: false });
  const fallback = (await nojs.page.locator('.nav [data-nav-fallback] > summary').boundingBox())!;
  await nojs.ctx.close();
  const js = await open(browser, {});
  await expect(js.page.locator('[data-nav-fallback]')).toHaveCount(0);
  const btn = js.page.locator('[data-menu-open]');
  await expect(btn).toBeVisible();
  const b = (await btn.boundingBox())!;
  for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(b[k] - fallback[k]), k).toBeLessThanOrEqual(1);
  // the overlay itself still opens and closes
  await btn.click();
  await expect(js.page.locator('#menu')).toBeVisible();
  await js.page.keyboard.press('Escape');
  await expect(js.page.locator('#menu')).toBeHidden();
  await js.ctx.close();
});

test('desktop without JavaScript: the bar links show, the fallback does not', async ({ browser }) => {
  const { ctx, page } = await open(browser, { javaScriptEnabled: false, viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });
  await expect(page.locator('.nav__links')).toBeVisible();
  await expect(page.locator('[data-nav-fallback]')).toBeHidden();
  await ctx.close();
});
