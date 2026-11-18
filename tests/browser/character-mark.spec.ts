// The Character watermark (the extracted bison layer, unaltered) is whole and centred
// behind the content at every width.
//
// Cause of the old position: it was anchored to the section's bottom-right corner
// (right: 3vw; bottom: -14%) at min(1240px, 112vw) wide, with the section's
// overflow: hidden clipping what fell outside. On phones the tall stacked section put
// it mostly below its bottom edge (and 12% past its left edge); at 1920 it sat 282px
// right of centre, upscaled past its native 1023px and cut off at the bottom.
import { test, expect } from '@playwright/test';
import { PRE } from '../helpers';

const SIZES = [
  [360, 800],
  [384, 832],
  [390, 844],
  [768, 1024],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
] as const;

for (const [width, height] of SIZES)
  test(`Character watermark whole, centred, never upscaled — ${width}×${height}`, async ({ browser }) => {
    const phone = width < 1024;
    const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', ...(phone ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    await page.goto(PRE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.querySelector('#character')!.scrollIntoView();
    });
    const img = page.locator('#character .character__mark img');
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    const m = await page.evaluate(() => {
      const section = document.querySelector('#character')!;
      const mark = section.querySelector('.character__mark') as HTMLElement;
      const im = mark.querySelector('img')!;
      const s = section.getBoundingClientRect();
      const r = im.getBoundingClientRect();
      const cs = (e: Element) => getComputedStyle(e);
      return {
        s: { l: s.left, t: s.top, r: s.right, b: s.bottom, w: s.width, h: s.height },
        m: { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height },
        natural: { w: im.naturalWidth, h: im.naturalHeight },
        // nothing offsets, masks or clips it between the image and the section
        chain: [im, im.parentElement!, mark].map((e) => ({ tag: e.tagName, transform: cs(e).transform, mask: cs(e).maskImage, clip: cs(e).clipPath, overflow: cs(e).overflow })),
        sectionOverflow: cs(section).overflow,
        opacity: cs(mark).opacity,
        zMark: cs(mark).zIndex,
        zInner: cs(section.querySelector('.character__inner')!).zIndex,
      };
    });
    // fully inside the section
    expect(m.m.l).toBeGreaterThanOrEqual(m.s.l);
    expect(m.m.t).toBeGreaterThanOrEqual(m.s.t);
    expect(m.m.r).toBeLessThanOrEqual(m.s.r);
    expect(m.m.b).toBeLessThanOrEqual(m.s.b);
    // centred on both axes (±8px)
    expect(Math.abs(m.m.l + m.m.w / 2 - (m.s.l + m.s.w / 2)), 'x').toBeLessThanOrEqual(8);
    expect(Math.abs(m.m.t + m.m.h / 2 - (m.s.t + m.s.h / 2)), 'y').toBeLessThanOrEqual(8);
    // never upscaled: at most the bison's native 1023px
    expect(m.natural.w).toBe(1023);
    expect(m.m.w).toBeLessThanOrEqual(1023);
    // the largest size inside 90% of the section's width and 80% of its height, undistorted
    const ratio = m.natural.w / m.natural.h;
    expect(Math.abs(m.m.w - Math.min(0.9 * m.s.w, 0.8 * m.s.h * ratio, 1023)), 'size').toBeLessThanOrEqual(1);
    expect(Math.abs(m.m.w / m.m.h - ratio)).toBeLessThan(0.01);
    for (const c of m.chain) {
      expect(c.transform).toBe('none');
      expect(c.mask).toBe('none');
      expect(c.clip).toBe('none');
      // (an <img> is overflow: clip by default, clipping only to its own box)
      if (c.tag !== 'IMG') expect(c.overflow, c.tag).toBe('visible');
    }
    expect(m.sectionOverflow).toBe('visible');
    // treatment and z-order as before: 7% opacity, behind the content
    expect(m.opacity).toBe('0.07');
    expect(Number(m.zMark)).toBeLessThan(Number(m.zInner));
    await ctx.close();
  });
