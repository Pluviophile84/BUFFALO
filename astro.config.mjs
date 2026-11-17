// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// Issue config source. Tests may point a build at a fixture in tests/fixtures/issue/;
// production (Vercel) builds always use src/config/issue.ts — a fixture can never deploy.
const fixture = process.env.BUFFALO_ISSUE_FIXTURE;
let issueConfigPath = path.join(root, 'src/config/issue.ts');
if (fixture) {
  if (process.env.VERCEL) throw new Error('BUFFALO_ISSUE_FIXTURE is not allowed in Vercel builds.');
  const p = path.resolve(root, fixture);
  if (!p.startsWith(path.join(root, 'tests/fixtures/issue') + path.sep) || !fs.existsSync(p)) {
    throw new Error(`BUFFALO_ISSUE_FIXTURE must name a file in tests/fixtures/issue/ (got ${fixture})`);
  }
  issueConfigPath = p;
}

// siteUrl is read from the config file text so canonical/OG/sitemap share one source.
const siteMatch = fs.readFileSync(path.join(root, 'src/config/issue.ts'), 'utf8').match(/siteUrl:\s*'([^']+)'/);
if (!siteMatch) throw new Error('siteUrl not found in src/config/issue.ts');
const site = siteMatch[1];

export default defineConfig({
  site,
  output: 'static',
  outDir: process.env.BUFFALO_OUT_DIR || 'dist',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  compressHTML: true,
  devToolbar: { enabled: false },
  prefetch: false,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
    {
      // Canonical form everywhere: apex, https, no trailing slash. The sitemap
      // library always serialises the origin as ".../", so normalise it after build.
      name: 'buffalo:apex-without-trailing-slash',
      hooks: {
        'astro:build:done': ({ dir }) => {
          const out = fileURLToPath(dir);
          for (const f of fs.readdirSync(out).filter((n) => /^sitemap-.*\.xml$/.test(n))) {
            const p = path.join(out, f);
            fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replaceAll(`<loc>${site}/</loc>`, `<loc>${site}</loc>`));
          }
        },
      },
    },
  ],
  vite: {
    resolve: { alias: { '@issue-config': issueConfigPath } },
    build: { assetsInlineLimit: 0, cssCodeSplit: false },
  },
});
