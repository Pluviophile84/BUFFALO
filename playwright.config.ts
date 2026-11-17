import { defineConfig } from '@playwright/test';

// `npm test` builds both states (tests/build-states.mjs), serves them with
// Vercel semantics + headers, then runs static and browser suites.
export default defineConfig({
  testDir: 'tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { trace: 'off', browserName: 'chromium', deviceScaleFactor: 1 },
  webServer: [
    { command: 'node tests/server.mjs dist 4400', url: 'http://127.0.0.1:4400/', reuseExistingServer: true },
    { command: 'node tests/server.mjs dist-live 4401', url: 'http://127.0.0.1:4401/', reuseExistingServer: true },
  ],
  projects: [
    { name: 'static', testMatch: /static\/.*\.spec\.ts/ },
    { name: 'browser', testMatch: /browser\/.*\.spec\.ts/ },
  ],
});
