import type { Page } from '@playwright/test';
// Identity fixture only: no real account, route, delivery or database write.
export async function mockOwnDriver(page: Page, headers: Record<string, string>) {
  await page.route('http://localhost:3000/driver/me', route => route.fulfill({ headers, json: { conductor_id: '00000000-0000-4000-8000-000000000009', nombre_completo: 'Conductor de prueba', estado: 'ACTIVO' } }));
}
