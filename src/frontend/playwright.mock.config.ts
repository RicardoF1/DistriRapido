import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Explicit allowlist: these specs intercept mutations with page.route.
  // Real-login / real-write specs (login, orders, users) are excluded.
  testMatch: [
    '**/driver-credentials.spec.ts',
    '**/routes.spec.ts',
    '**/driver-accounts.spec.ts',
    '**/driver-panel.spec.ts',
    '**/sprint2-mocked.spec.ts', '**/drivers.spec.ts', '**/availability.spec.ts',
    '**/login-email.spec.ts', '**/login-background.spec.ts',
    '**/order-marker-sync.spec.ts', '**/order-coverage.spec.ts',
    '**/order-consultation.spec.ts', '**/order-navigation.spec.ts',
    '**/responsive.spec.ts', '**/admin-welcome.spec.ts', '**/admin-summary.spec.ts',
  ],
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge',
  },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 900 } } }],
});
