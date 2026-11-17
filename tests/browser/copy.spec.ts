// §13.4 Copy lint: banned list (§12) and every §5 string verbatim for the active state.
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { STATES, ROOT } from '../helpers';

type Entry = { text: string; state: 'both' | 'pre' | 'live'; page: string };
const SPEC: Entry[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/spec-copy.json'), 'utf8'));
const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

async function pageText(page: Page) {
  return page.evaluate(() => {
    // Raw DOM text (no CSS text-transform), joined with a space only where the
    // nearest non-inline container changes, so inline runs stay verbatim.
    const box = (n: Node) => {
      let e = n.parentElement;
      while (e && (/^inline/.test(getComputedStyle(e).display) || e.matches('.vh, .glyph-b'))) e = e.parentElement;
      return e;
    };
    let text = '';
    let last: Element | null = null;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode as Text;
      if (n.parentElement!.closest('script, style, noscript, template')) continue;
      const b = box(n);
      text += (b !== last ? ' ' : '') + n.data;
      last = b;
    }
    const attrs = [...document.querySelectorAll('[aria-label], [alt], [title]')].map((e) => [e.getAttribute('aria-label'), e.getAttribute('alt'), e.getAttribute('title')].filter(Boolean).join(' '));
    return { text, attrs: attrs.join(' ') };
  });
}

const BANNED_WORDS = ['herd', 'moon', 'lambo', 'ape', 'degen', 'wagmi', 'ngmi', '100x', '1000x', 'guaranteed', 'premium', 'luxury', 'prestigious', 'iconic', 'exclusive', 'revolutionary', 'community-driven', 'to the moon'];

for (const st of STATES)
  for (const route of ['/', '/disclaimer', '/404']) {
    test(`copy lint ${st.name} ${route}`, async ({ page }) => {
      await page.goto(st.base + route, { waitUntil: 'domcontentloaded' });
      const { text, attrs } = await pageText(page);
      const all = norm(`${text} ${attrs}`);
      for (const w of BANNED_WORDS) expect(all, `banned "${w}"`).not.toMatch(new RegExp(`(^|[^\\p{L}\\p{N}-])${w}($|[^\\p{L}\\p{N}-])`, 'iu'));
      expect(all, 'exclamation mark').not.toContain('!');
      expect(all, '$BUFF token').not.toMatch(/\$BUFF(?![A-Z])/);
      expect(all, 'emoji').not.toMatch(/(?![©®™])\p{Extended_Pictographic}/u);
      for (const m of all.matchAll(/\bpump\b/gi)) expect(all.slice(m.index!, m.index! + 8).toLowerCase()).toBe('pump.fun');
      // the project is "BUFFALO", never "Buffalo Coin/Token" ("American Buffalo coins" is the Mint's programme)
      expect(all, 'name').not.toMatch(/(?<!American )buffalo (coin|token)/i);
      expect(all, 'holders are Custodians').not.toMatch(/\b(army|fam)\b/i);

      // "legal tender" only in Card I's wit, the Section IV body and the disclaimer
      const contexts = await page.evaluate(() => {
        const out: string[] = [];
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) {
          const n = w.currentNode as Text;
          if (!/legal tender/i.test(n.data)) continue;
          const el = n.parentElement!;
          out.push(
            el.closest('[data-card="I"] .card__wit') ? 'card-i-wit' : el.closest('.release__body') ? 'release-body' : el.closest('.footer__disclaimer, .page__prose') ? 'disclaimer' : `OTHER: ${el.outerHTML.slice(0, 80)}`,
          );
        }
        return out;
      });
      for (const c of contexts) expect(c).not.toMatch(/^OTHER/);

      // every §5 string for this page and state, verbatim
      const want = SPEC.filter((e) => (e.page === route || (route === '/disclaimer' && false)) && (e.state === 'both' || (e.state === 'pre') === (st.name === 'pre-issue')));
      if (route === '/') expect(want.length).toBeGreaterThan(140);
      const missing = want.filter((e) => !all.includes(norm(e.text))).map((e) => e.text);
      expect(missing, `missing §5 copy:\n${missing.join('\n')}`).toEqual([]);
      // and the other state's exclusive strings are absent (no hidden duplicates)
      const other = SPEC.filter((e) => e.page === route && e.state === (st.name === 'pre-issue' ? 'live' : 'pre'));
      const leaked = other.filter((e) => !SPEC.some((x) => x.text === e.text && x.state !== e.state) && all.includes(norm(e.text)) && e.text.length > 12).map((e) => e.text);
      expect(leaked, `other-state copy shipped:\n${leaked.join('\n')}`).toEqual([]);
    });
  }

test('disclaimer page carries the full disclaimer and credits', async ({ page }) => {
  await page.goto(STATES[0].base + '/disclaimer');
  const t = norm((await pageText(page)).text);
  for (const e of SPEC.filter((x) => /memecoin|independent project|no jurisdiction|responsible for the laws/.test(x.text))) expect(t).toContain(norm(e.text));
  await expect(page.locator('.credits a[href^="https://commons.wikimedia.org/wiki/File:US_$10_1901.jpg"]')).toHaveCount(1);
  await expect(page.locator('.credits a[href="https://commons.wikimedia.org/wiki/File:2006_American_Buffalo_Proof_Reverse.jpg"]')).toHaveCount(1);
});
