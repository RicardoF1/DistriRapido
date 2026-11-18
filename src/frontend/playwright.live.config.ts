import { defineConfig, devices } from '@playwright/test';

// Live environment: real backend + PostgreSQL + production build of the frontend.
// Excluded from the mocked suites (playwright.mock.config.ts / playwright.ci.config.ts).
// Requires E2E_LIVE=1 and the variables documented in e2e/live-env.ts.
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/performance.spec.ts', '**/resilience.spec.ts'],
  workers: 1,
  fullyParallel: false,
  retries: 0,
  // Own output folder: never clears the artifacts of the mocked suites (test-results/).
  outputDir: 'test-results-live',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-live' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Web Vitals (LCP) are only exposed by Chromium; the measurement runs on a single engine.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
