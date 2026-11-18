import { test } from '@playwright/test';

// Shared settings for the specs that run against a live environment
// (performance.spec.ts and resilience.spec.ts). Credentials always come from
// the environment; nothing is stored in the repository.
export const live = {
  enabled: process.env.E2E_LIVE === '1',
  api: (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  adminEmail: process.env.E2E_ADMIN_EMAIL ?? '',
  adminPassword: process.env.E2E_ADMIN_PASSWORD ?? '',
  driverEmail: process.env.E2E_DRIVER_EMAIL ?? '',
  driverPassword: process.env.E2E_DRIVER_PASSWORD ?? '',
};

export function requireLiveEnvironment() {
  test.skip(!live.enabled, 'Requiere entorno levantado: E2E_LIVE=1, backend, PostgreSQL y build del frontend.');
  test.skip(live.enabled && (!live.adminEmail || !live.adminPassword), 'Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.');
}

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
