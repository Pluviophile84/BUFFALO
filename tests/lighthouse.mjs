#!/usr/bin/env node
// Serve both builds with Vercel semantics + headers, run Lighthouse CI, summarise.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const up = (port) => new Promise((res) => https.get(`https://127.0.0.1:${port}/`, { rejectUnauthorized: false }, (r) => res(r.statusCode === 200)).on('error', () => res(false)));
const servers = [];
for (const [dir, port] of [['dist', 4410], ['dist-live', 4411]]) {
  if (!(await up(port))) servers.push(spawn(process.execPath, [path.join(root, 'tests/server.mjs'), dir, String(port), '--h2'], { stdio: 'ignore' }));
}
for (let i = 0; i < 100 && !((await up(4410)) && (await up(4411))); i++) await new Promise((r) => setTimeout(r, 100));

fs.rmSync(path.join(root, '.lighthouseci'), { recursive: true, force: true });
const lhci = path.join(root, 'node_modules/.bin/lhci');
const run = (args) => spawnSync(lhci, args, { cwd: root, stdio: 'inherit', env: process.env }).status;
let status = run(['collect', '--config=lighthouserc.cjs']);
if (status === 0) status = run(['assert', '--config=lighthouserc.cjs']);
run(['upload', '--config=lighthouserc.cjs']);

// Summary (median by performance score per URL)
const lhr = fs
  .readdirSync(path.join(root, '.lighthouseci'))
  .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, '.lighthouseci', f), 'utf8')));
const byUrl = {};
for (const r of lhr) (byUrl[r.finalDisplayedUrl ?? r.finalUrl] ??= []).push(r);
const summary = {};
for (const [url, runs] of Object.entries(byUrl)) {
  runs.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
  const m = runs[Math.floor(runs.length / 2)];
  const a = (id) => m.audits[id]?.numericValue;
  summary[url] = {
    performance: m.categories.performance.score * 100,
    accessibility: m.categories.accessibility.score * 100,
    'best-practices': m.categories['best-practices'].score * 100,
    seo: m.categories.seo.score * 100,
    'LCP ms': Math.round(a('largest-contentful-paint')),
    'FCP ms': Math.round(a('first-contentful-paint')),
    CLS: Number(a('cumulative-layout-shift').toFixed(4)),
    'TBT ms': Math.round(a('total-blocking-time')),
    'LCP element': m.audits['lcp-breakdown-insight']?.details?.items?.find((i) => i.type === 'node')?.selector ?? null,
  };
}
fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
fs.writeFileSync(path.join(root, 'test-results/lighthouse.json'), JSON.stringify(summary, null, 2));
console.table(summary);
for (const s of servers) s.kill();
process.exit(status ?? 1);
