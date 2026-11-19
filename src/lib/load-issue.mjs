// One config source for every Node-side consumer: astro.config.mjs (site URL),
// scripts/build-og.mjs (the OG image) and scripts/verify-mint.mjs. Each loads the
// same file and runs it through the same deriveIssue() the page uses, so an
// invalid config fails wherever it is read first.
//
// Tests may point a build at a fixture in tests/fixtures/issue/; production
// (Vercel) builds always use src/config/issue.ts — a fixture can never deploy.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { deriveIssue } from './validate-issue.mjs';

/** The config file this process must read, given the repository root. */
export function issueConfigPath(root, env = process.env) {
  const fixture = env.BUFFALO_ISSUE_FIXTURE;
  if (!fixture) return path.join(root, 'src/config/issue.ts');
  if (env.VERCEL) throw new Error('BUFFALO_ISSUE_FIXTURE is not allowed in Vercel builds.');
  const p = path.resolve(root, fixture);
  if (!p.startsWith(path.join(root, 'tests/fixtures/issue') + path.sep) || !fs.existsSync(p)) {
    throw new Error(`BUFFALO_ISSUE_FIXTURE must name a file in tests/fixtures/issue/ (got ${fixture})`);
  }
  return p;
}

/** Load and validate the config: { path, config, issue }. Throws on any violation. */
export async function loadIssue(root, env = process.env) {
  const p = issueConfigPath(root, env);
  const { ISSUE } = await import(pathToFileURL(p).href);
  return { path: p, config: ISSUE, issue: deriveIssue(ISSUE) };
}
