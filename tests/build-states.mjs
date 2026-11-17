#!/usr/bin/env node
// Build both states for the test suite: dist (shipped config, pre-issue) and
// dist-live (fixture live config). Sequential: both write public/og.
import { execFileSync } from 'node:child_process';
const run = (env, label) => {
  console.log(`\n▸ build ${label}`);
  execFileSync('npm', ['run', 'build', '--silent'], { stdio: 'inherit', env: { ...process.env, ...env, ASTRO_TELEMETRY_DISABLED: '1' } });
};
run({ BUFFALO_OUT_DIR: 'dist-live', BUFFALO_ISSUE_FIXTURE: 'tests/fixtures/issue/live.ts' }, 'live fixture → dist-live');
run({ BUFFALO_OUT_DIR: 'dist' }, 'shipped config → dist');
