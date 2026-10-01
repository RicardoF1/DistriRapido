import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8', reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.test.*', 'src/test/**', 'src/types/**'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
