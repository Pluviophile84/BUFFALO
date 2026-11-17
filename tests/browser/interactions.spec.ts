import { test, expect } from '@playwright/test';
import { PRE, LIVE, LIVE_CONTRACT } from '../helpers';

test.describe('pre-issue state', () => {
  test('acquire and explorer controls are inert and explained', async ({ page }) => {
    await page.goto(PRE + '/');
    const disabled = page.locator('main a[aria-disabled="true"]');
    expect(await disabled.count()).toBeGreaterThanOrEqual(5);
    for (const a of await disabled.all()) {
      expect(await a.getAttribute('href')).toBeNull();
      const help = await a.getAttribute('aria-describedby');
      await expect(page.locator(`#${help}`)).toBeVisible();
    }
    await expect(page.locator('.hero .btn[aria-disabled="true"]').first()).toHaveText('Issue pending');
    await expect(page.locator('button.serial__copy').first()).toBeDisabled();
    // keyboard never lands on a disabled action
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-disabled'))).not.toBe('true');
    }
  });

  test('specimen marks shown, never over the artwork', async ({ page }) => {
    await page.goto(PRE + '/');
    await expect(page.locator('.serial__specimen')).toHaveCount(2);
    const stamp = (await page.locator('.hero__stamp').boundingBox())!;
    const coin = (await page.locator('.hero__coin').boundingBox())!;
    const cx = coin.x + coin.width / 2;
    const cy = coin.y + coin.height / 2;
    const nx = Math.max(stamp.x, Math.min(cx, stamp.x + stamp.width));
    const ny = Math.max(stamp.y, Math.min(cy, stamp.y + stamp.height));
    expect((nx - cx) ** 2 + (ny - cy) ** 2).toBeGreaterThan((coin.width / 2) ** 2);
  });
});

test.describe('live state', () => {
  test('copy the serial: Copied for 1.8s, announced politely', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    await page.goto(LIVE + '/');
    const btn = page.locator('.hero button[data-copy]');
    await btn.click();
    await expect(btn).toHaveText('Copied');
    await expect(page.locator('#live-status')).toHaveText('Serial copied.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(LIVE_CONTRACT);
    await page.waitForTimeout(1900);
    await expect(btn).toHaveText('Copy');
    await ctx.close();
  });

  test('serial everywhere is identical; links derived; specimen gone', async ({ page }) => {
    await page.goto(LIVE + '/');
    const serials = await page.locator('[data-serial]').allTextContents();
    expect(new Set(serials)).toEqual(new Set([LIVE_CONTRACT]));
    await expect(page.locator('[data-specimen]')).toHaveCount(0);
    await expect(page.locator('.hero a.btn--primary')).toHaveAttribute('href', `https://pump.fun/coin/${LIVE_CONTRACT}`);
    await expect(page.locator('.hero a.btn--primary')).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.locator('.strip dd').nth(3)).toHaveText(`${LIVE_CONTRACT.slice(0, 6)}…${LIVE_CONTRACT.slice(-6)}`);
  });
});

test('the strike plays once per session; skipped for reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(PRE + '/');
  await expect(page.locator('.hero__coin')).not.toHaveClass(/coin--struck/);
  await page.reload();
  await expect(page.locator('.hero__coin')).toHaveClass(/coin--struck/);
  await ctx.close();
  const rm = await browser.newContext({ reducedMotion: 'reduce' });
  const p2 = await rm.newPage();
  await p2.goto(PRE + '/');
  await expect(p2.locator('.hero__coin')).toHaveClass(/coin--struck/);
  await rm.close();
});

test('the H1 is painted at first paint: never transparent, clipped or masked', async ({ page }) => {
  await page.goto(PRE + '/', { waitUntil: 'commit' });
  await page.waitForSelector('h1');
  const s = await page.evaluate(() => {
    const out = [];
    for (let el: Element | null = document.querySelector('h1'); el && el !== document.body; el = el.parentElement) {
      const cs = getComputedStyle(el);
      out.push({ o: cs.opacity, clip: cs.clipPath, mask: cs.maskImage, v: cs.visibility, ink: (el as HTMLElement).dataset.ink ?? null });
    }
    return out;
  });
  for (const x of s) {
    expect(x.o).toBe('1');
    expect(x.clip).toBe('none');
    expect(x.mask).toBe('none');
    expect(x.v).toBe('visible');
    expect(x.ink).toBeNull();
  }
});

test('mobile menu: focus trap, Esc closes, background inert, focus restored', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(PRE + '/');
  const open = page.locator('[data-menu-open]');
  await expect(open).toBeVisible();
  await open.click();
  const menu = page.locator('#menu');
  await expect(menu).toBeVisible();
  await expect(open).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => (document.querySelector('main') as HTMLElement).inert)).toBe(true);
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#menu'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-open'))).toBe(true);
  expect(await page.evaluate(() => (document.querySelector('main') as HTMLElement).inert)).toBe(false);
  await ctx.close();
});

test('the Mark: hotspots and annotations highlight together; arrows cycle; ket decodes', async ({ page }) => {
  await page.goto(PRE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('#mark')!.scrollIntoView();
  });
  const mark = page.locator('[data-mark]');
  await page.locator('[data-spot="bison"]').hover();
  await expect(mark).toHaveAttribute('data-active', 'bison');
  await expect(page.locator('[data-item="bison"]')).toHaveClass(/is-hot/);
  await expect.poll(() => page.locator('#mark-coin [data-layer="rim"]').evaluate((e) => getComputedStyle(e).opacity)).toBe('0.4');
  await expect.poll(() => page.locator('#mark-coin [data-layer="bison"]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  await page.locator('[data-pick="ground"]').click();
  await expect(page.locator('[data-pick="ground"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-spot="ground"]')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(0, 0);
  await expect(mark).toHaveAttribute('data-active', 'ground');
  // keyboard: arrows cycle hotspots
  await page.locator('[data-spot="rim"]').focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.spot)).toBe('field');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.spot)).toBe('ground');
  // touch targets ≥ 44px
  for (const b of await page.locator('[data-spot]').all()) {
    const bb = (await b.boundingBox())!;
    expect(bb.width).toBeGreaterThanOrEqual(44);
    expect(bb.height).toBeGreaterThanOrEqual(44);
  }
  // ket decoder
  const ket = page.locator('[data-ket]');
  await expect(ket).toHaveAccessibleName('Ket notation line, binary for BUFFALO.');
  await ket.focus();
  await page.waitForTimeout(900);
  const read = await page.locator('.ket__byte.is-read .ket__letter').allTextContents();
  expect(read.join('')).toBe('BUFFALO');
});

test('reduced motion: reveals never hide content', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(PRE + '/');
  expect(await page.locator('[data-ink="pending"], [data-draw="pending"]').count()).toBe(0);
  await ctx.close();
});

test('no JavaScript: page complete, coin complete', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(PRE + '/');
  await expect(page.locator('h1')).toContainText('Now it belongs to no nation.');
  expect(await page.locator('.hero__coin .coin__b').evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  expect(await page.locator('.hero__coin .coin__b').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  await ctx.close();
});

test('ink reveals: nothing on screen at load is hidden; below-the-fold copy is pulled in on scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const onScreenPending = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-ink], [data-draw]')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && (el.dataset.ink === 'pending' || el.dataset.draw === 'pending');
    }).length,
  );
  expect(onScreenPending).toBe(0);
  await expect(page.locator('.statement__text p').first()).toHaveAttribute('data-ink', 'pending');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('.statement__text')!.scrollIntoView({ block: 'center' });
  });
  await expect(page.locator('.statement__text p').first()).toHaveAttribute('data-ink', /^(in|done)$/);
  await expect(page.locator('.statement__text p').first()).toHaveAttribute('data-ink', 'done', { timeout: 5000 });
});
