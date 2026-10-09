import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
import coverageRaw from '../../../../geodata/coverage/v1/coverage.geojson?raw';
beforeAll(async () => {
  const original = globalThis.fetch;
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => coverageRaw });
  try {
    const actual = await vi.importActual<typeof import('../services/coverage')>('../services/coverage');
    await actual.loadCoverage();
  } finally { globalThis.fetch = original; }
});
afterEach(cleanup);
