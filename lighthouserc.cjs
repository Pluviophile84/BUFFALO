// Lighthouse CI — §9 budgets as assertions (mobile: Moto G Power class, simulated 4G).
// Run via `npm run lighthouse`: tests/lighthouse.mjs serves dist/ and dist-live/ the
// way Vercel does (HTTP/2 + TLS, brotli, cleanUrls, the exact vercel.json headers),
// then runs collect + assert.
const median = { aggregationMethod: 'median-run' };
module.exports = {
  ci: {
    collect: {
      url: ['https://127.0.0.1:4410/', 'https://127.0.0.1:4410/disclaimer', 'https://127.0.0.1:4411/'],
      numberOfRuns: 3,
      chromePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium',
      // self-signed local certificate only; production is served by Vercel's edge
      settings: { chromeFlags: '--headless=new --no-sandbox --disable-gpu --ignore-certificate-errors' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.98, ...median }],
        'categories:accessibility': ['error', { minScore: 1, ...median }],
        'categories:best-practices': ['error', { minScore: 1, ...median }],
        'categories:seo': ['error', { minScore: 1, ...median }],
        'largest-contentful-paint': ['error', { maxNumericValue: 1800, ...median }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02, ...median }],
        'total-blocking-time': ['error', { maxNumericValue: 50, ...median }],
        'resource-summary:script:size': ['error', { maxNumericValue: 30 * 1024, ...median }],
        'resource-summary:third-party:count': ['error', { maxNumericValue: 0, ...median }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
