import { test, expect, type Page } from '@playwright/test';

async function fixture(page: Page, origin: string, state = 'active') {
  let loggedIn = false;
  const user = { usuario_id: '00000000-0000-4000-8000-000000000001', email: 'driver@example.test', rol: { rol_id: '00000000-0000-4000-8000-000000000002', nombre: 'Usuario Final / Conductor' } };
  const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' };
  let forbiddenCalls = 0;
  await page.route('http://localhost:3000/**', route => { forbiddenCalls++; return route.abort(); });
  await page.route('http://localhost:3000/auth/**', route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const path = new URL(route.request().url()).pathname;
    if (path === '/auth/login') { loggedIn = true; return route.fulfill({ headers, json: { user, expiresIn: 900, accessToken: 'synthetic-fixture', tokenType: 'Bearer' } }); }
    if (path === '/auth/logout') { loggedIn = false; return route.fulfill({ status: 204, headers }); }
    return route.fulfill({ status: loggedIn ? 200 : 401, headers, json: loggedIn ? { ...user, expiresAt: Date.now() + 900000 } : {} });
  });
  await page.route('http://localhost:3000/driver/me', route => {
    expect(new URL(route.request().url()).search).toBe('');
    if (state === 'network') return route.abort();
    if (state === 'unlinked' || state === 'inactive') return route.fulfill({ status: 403, headers, json: { message: state === 'unlinked' ? 'Tu cuenta no tiene un conductor vinculado. Contacta al administrador.' : 'Tu ficha de conductor está inactiva. Contacta al administrador.' } });
    return route.fulfill({ headers, json: { conductor_id: '00000000-0000-4000-8000-000000000003', nombre_completo: 'Conductor de prueba', estado: 'ACTIVO' } });
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: /Iniciar sesión/ }).click();
  await expect(page).toHaveURL(/\/acceso\/conductor$/);
  return { expire: () => { loggedIn = false; }, forbiddenCalls: () => forbiddenCalls };
}

for (const width of [390, 768, 1366, 1440]) test('panel propio responsive ' + width, async ({ page, baseURL }) => {
  await page.setViewportSize({ width, height: 900 }); const mock = await fixture(page, new URL(baseURL!).origin);
  await expect(page.getByText('Conductor de prueba', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Panel del conductor' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mis rutas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mis entregas' })).toBeVisible();
  await expect(page.getByText('La consulta de rutas estará disponible cuando se implemente el módulo de asignaciones')).toBeVisible();
  await expect(page.getByText(/No tienes rutas asignadas/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width < 1024) await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('link', { name: 'Mis rutas', exact: true }).click();
  await expect(page).toHaveURL(/#mis-rutas$/);
  await page.reload(); await expect(page.getByText('Conductor de prueba', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Correo electrónico')).toHaveValue('driver@example.test');
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => ({ local: localStorage.length, session: { ...sessionStorage } }))).toEqual({ local: 0, session: { 'ecoruta.login.email': 'driver@example.test' } });
  expect(mock.forbiddenCalls()).toBe(0);
});
test('bloquea URL administrativas y restaura login al expirar', async ({ page, baseURL }) => {
  const mock = await fixture(page, new URL(baseURL!).origin);
  for (const path of ['/usuarios', '/vehiculos', '/conductores', '/disponibilidad', '/pedidos', '/acceso/administrador']) {
    await page.goto(path); await expect(page).toHaveURL(/\/acceso\/conductor$/);
    await expect(page.getByText('Conductor de prueba', { exact: true })).toBeVisible();
  }
  expect(mock.forbiddenCalls()).toBe(0); mock.expire();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/\/login$/);
});
for (const state of ['unlinked', 'inactive', 'network']) test('estado diferenciado ' + state, async ({ page, baseURL }) => {
  await fixture(page, new URL(baseURL!).origin, state);
  await expect(page.getByRole('alert')).toContainText(state === 'unlinked' ? 'no tiene un conductor vinculado' : state === 'inactive' ? 'inactiva' : 'No se pudo conectar');
  await expect(page.getByRole('heading', { name: 'Mis rutas' })).toHaveCount(0);
  await expect(page.getByText(/No tienes rutas asignadas/)).toHaveCount(0);
});
