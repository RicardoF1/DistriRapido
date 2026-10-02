import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, fullyParallel: false,
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173', trace: 'off', screenshot: 'off', video: 'off', channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
