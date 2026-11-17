// §13.5 axe-core: zero violations on /, /disclaimer, /404 at 375 and 1440, both states, motion on/off.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STATES } from '../helpers';

for (const st of STATES)
  for (const route of ['/', '/disclaimer', '/404'])
    for (const width of [375, 1440])
      for (const motion of ['reduce', 'no-preference'] as const) {
        test(`axe ${st.name} ${route} @${width} motion:${motion}`, async ({ browser }) => {
          const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: motion });
          const page = await ctx.newPage();
          await page.goto(st.base + route, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready);
          const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
          const v = res.violations.map((x) => `${x.id} (${x.impact}): ${x.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(' | ')}`);
          expect(v, v.join('\n')).toEqual([]);
          await ctx.close();
        });
      }
