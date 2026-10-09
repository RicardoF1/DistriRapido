import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
import synthetic from '../../../../test-fixtures/coverage-synthetic.json';
const coverageRaw = JSON.stringify(synthetic.coverage);
vi.mock('../../../../geodata/coverage-release.json?raw', async () => ({ default: JSON.stringify((await import('../../../../test-fixtures/coverage-synthetic.json')).default.release) }));
beforeAll(async () => {
  const original = globalThis.fetch;
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => coverageRaw });
  try {
    const actual = await vi.importActual<typeof import('../services/coverage')>('../services/coverage');
    await actual.loadCoverage();
  } finally { globalThis.fetch = original; }
});
afterEach(cleanup);
