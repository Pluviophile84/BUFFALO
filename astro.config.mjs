// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadIssue } from './src/lib/load-issue.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

// The issue config (shipped file, or a test fixture outside Vercel) through the same
// deriveIssue() the page and the OG build use: canonical, OG and sitemap share its
// validated siteUrl, and an invalid config fails here, before anything is built.
const { path: issueConfigPath, issue } = await loadIssue(root);
const site = issue.siteUrl;

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
