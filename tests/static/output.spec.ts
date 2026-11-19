// §10 CSP output check, §7 metadata, single canonical host.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { STATES, walk, ROOT } from '../helpers';

const SITE = 'https://buffalocoin.xyz';
// External hosts the site links to on purpose (credits, sources, schema, live routes).
const EXTERNAL = new Set(['commons.wikimedia.org', 'www.usmint.gov', 'www.nps.gov', 'home.nps.gov', 'www.fontsinuse.com', 'schema.org', 'pump.fun', 'solscan.io', 'x.com', 't.me']);

for (const st of STATES) {
  test.describe(st.name, () => {
    const htmlFiles = walk(st.dist, (f) => f.endsWith('.html'));

    test('no inline scripts, inline styles or event handlers', () => {
      expect(htmlFiles.length).toBe(3);
      for (const f of htmlFiles) {
        const h = fs.readFileSync(f, 'utf8');
        for (const m of h.matchAll(/<script\b([^>]*)>/g)) {
          const attrs = m[1]!;
          // JSON-LD is a non-executable data block; everything else must be external.
          if (/type="application\/ld\+json"/.test(attrs)) continue;
          expect(attrs, `inline <script> in ${f}`).toMatch(/\ssrc="\/_astro\//);
        }
        expect(h, `<style> in ${f}`).not.toMatch(/<style[\s>]/);
        expect(h, `style= in ${f}`).not.toMatch(/\sstyle="/);
        expect(h, `on*= handler in ${f}`).not.toMatch(/\son[a-z]+="/i);
        expect(h).not.toMatch(/javascript:/i);
      }
    });

    test('canonical, og:url, og:image, twitter:image are absolute on the apex', () => {
      const pages = { 'index.html': SITE, 'disclaimer.html': `${SITE}/disclaimer` };
      for (const [file, url] of Object.entries(pages)) {
        const h = fs.readFileSync(path.join(st.dist, file), 'utf8');
        expect(h).toContain(`<link rel="canonical" href="${url}">`);
        expect(h).toContain(`<meta property="og:url" content="${url}">`);
        const og = h.match(/<meta property="og:image" content="([^"]+)">/)![1]!;
        const tw = h.match(/<meta name="twitter:image" content="([^"]+)">/)![1]!;
        expect(og).toBe(tw);
        expect(og).toMatch(new RegExp(`^${SITE}/og/buffalo-fourth-issue${st.name === 'live' ? '' : '-specimen'}\\.png$`));
        expect(fs.existsSync(path.join(st.dist, new URL(og).pathname))).toBe(true);
        expect(h).toContain('<meta name="twitter:card" content="summary_large_image">');
      }
    });

    test('no other host appears in built absolute URLs', () => {
      const files = walk(st.dist, (f) => /\.(html|xml|txt|webmanifest)$/.test(f));
      for (const f of files) {
        const t = fs.readFileSync(f, 'utf8');
        const urls = [...t.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0]);
        for (const u of urls) {
          if (/^https?:\/\/www\.(sitemaps\.org|w3\.org|google\.com)\/(schemas|1999|2000)/.test(u)) continue; // XML namespaces
          const url = new URL(u);
          expect(url.protocol, u).toBe('https:');
          if (url.hostname === 'buffalocoin.xyz') {
            expect(u, `trailing slash: ${u}`).not.toMatch(/\/$/);
            continue;
          }
          expect(EXTERNAL.has(url.hostname), `unexpected host ${url.hostname} in ${path.relative(st.dist, f)}`).toBe(true);
        }
      }
      const sitemap = fs.readFileSync(path.join(st.dist, 'sitemap-0.xml'), 'utf8');
      expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual([SITE, `${SITE}/disclaimer`]);
      expect(fs.readFileSync(path.join(st.dist, 'robots.txt'), 'utf8')).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
    });

    test('title, description, theme, JSON-LD WebSite only', () => {
      const h = fs.readFileSync(path.join(st.dist, 'index.html'), 'utf8');
      const title = 'BUFFALO ($BUFFALO) · Paper. Nickel. Gold. Blockchain.';
      const description = 'Paper. Nickel. Gold. Blockchain. For more than a century, the bison has marked American money. $BUFFALO is an independent Solana memecoin inspired by that history.';
      // 1901, 1913 and 2006 are landmarks chosen for the story, not a count
      expect(h).not.toMatch(/three times/i);
      expect(h).toContain(`<title>${title}</title>`);
      expect(h).toContain(`<meta name="description" content="${description}">`);
      // Open Graph and Twitter carry the same title and description
      for (const k of ['property="og:title"', 'name="twitter:title"']) expect(h).toContain(`<meta ${k} content="${title}">`);
      for (const k of ['property="og:description"', 'name="twitter:description"']) expect(h).toContain(`<meta ${k} content="${description}">`);
      expect(h).toContain('<meta name="theme-color" content="#0E100B">');
      expect(h).toContain('<meta name="color-scheme" content="dark">');
      const ld = JSON.parse(h.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)![1]!);
      expect(ld['@type']).toBe('WebSite');
      expect(ld.url).toBe(SITE);
      expect(h.match(/application\/ld\+json/g)).toHaveLength(1);
      const nf = fs.readFileSync(path.join(st.dist, '404.html'), 'utf8');
      expect(nf).toContain('<meta name="robots" content="noindex">');
    });
  });
}

test('vercel.json: headers and caching', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const all = v.headers.find((h: { source: string }) => h.source === '/(.*)').headers as { key: string; value: string }[];
  const get = (k: string) => all.find((h) => h.key === k)?.value;
  expect(get('Content-Security-Policy')).toBe("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests");
  expect(get('Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains; preload');
  expect(get('X-Frame-Options')).toBe('DENY');
  expect(get('Cross-Origin-Opener-Policy')).toBe('same-origin');
  expect(v.cleanUrls).toBe(true);
  expect(v.trailingSlash).toBe(false);
  const cache = (src: string) => v.headers.find((h: { source: string }) => h.source === src).headers[0].value;
  expect(cache('/_astro/(.*)')).toContain('immutable');
  expect(cache('/((?!_astro/|og/).*)')).toBe('no-cache');
  expect(cache('/og/(.*)')).toBe('public, max-age=86400');
  // Batch 3: immutable is only for fingerprinted URLs (/_astro/): no other rule says it
  const immutable = v.headers.filter((h: { headers: { value: string }[] }) => h.headers.some((x) => /immutable/.test(x.value))).map((h: { source: string }) => h.source);
  expect(immutable).toEqual(['/_astro/(.*)']);
});

test('brand layers and the Custodian Kit are fingerprinted; nothing is served under /brand or /kit', () => {
  for (const st of ['dist', 'dist-live']) {
    const out = path.join(ROOT, st);
    expect(fs.existsSync(path.join(out, 'brand')), `${st}/brand`).toBe(false);
    expect(fs.existsSync(path.join(out, 'kit')), `${st}/kit`).toBe(false);
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    expect(html).not.toMatch(/["'\s(]\/(brand|kit)\//);
    // every brand layer and kit file the page references: /_astro/<name>.<hash>.<ext>, and the file exists
    const refs = [...html.matchAll(/\/_astro\/((?:bison-\d+|ground|guilloche|buffalo-[\w-]+|emblem|b|x-header|wallpaper)\.([\w-]{8})\.(avif|webp|png|svg))/g)].map((m) => m[1]!);
    for (const r of refs) expect(fs.existsSync(path.join(out, '_astro', r)), r).toBe(true);
    const names = new Set(refs.map((r) => r.replace(/\.[\w-]{8}\.(\w+)$/, '.$1')));
    for (const n of ['bison-480.avif', 'bison-768.webp', 'bison-1023.avif', 'ground.webp', 'guilloche.svg', 'buffalo-emblem-2048.png', 'buffalo-b-ink.svg', 'buffalo-wallpaper-phone-1290x2796.png', 'emblem.webp', 'x-header.webp'])
      expect(names, n).toContain(n);
    // downloads keep their plain filenames
    expect(html).toMatch(/href="\/_astro\/buffalo-emblem-1024\.[\w-]{8}\.png" download="buffalo-emblem-1024\.png"/);
  }
});

test('verification-only renders are not deployed', () => {
  for (const f of ['bison.png', 'ground.png', 'frame.svg', 'b-symbol.svg', 'b-symbol-ink.svg', 'b-symbol-bronze.svg', 'manifest.json']) {
    expect(fs.existsSync(path.join(ROOT, 'tests/fixtures/layers', f)), f).toBe(true);
    for (const st of ['dist', 'dist-live']) expect(walk(path.join(ROOT, st), (p) => path.basename(p) === f || new RegExp(`^${f.replace('.', '\\.[\\w-]{8}\\.')}$`).test(path.basename(p)))).toEqual([]);
  }
  expect(fs.existsSync(path.join(ROOT, 'public/brand'))).toBe(false);
});
