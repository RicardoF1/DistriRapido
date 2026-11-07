import { test, expect, type Page } from '@playwright/test';

async function fixture(page: Page, origin: string, state = 'active') {
  let loggedIn = false;
  const user = { usuario_id: '00000000-0000-4000-8000-000000000001', email: 'driver@example.test', rol: { rol_id: '00000000-0000-4000-8000-000000000002', nombre: 'Usuario Final / Conductor' } };
  const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' };
  let forbiddenCalls = 0;
  let routeCalls = 0;
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
  await page.route('http://localhost:3000/driver/routes', route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    routeCalls++;
    return route.fulfill({ headers, json: [{ ruta_id: '00000000-0000-4000-8000-000000000004', estado: 'ASIGNADA', asignado_en: '2030-01-01T12:00:00Z', iniciado_en: null, current_version: 1, version: { ruta_version_id: '00000000-0000-4000-8000-000000000005', numero: 1, distancia_m: '5000', duracion_s: '900', resultado: {}, vehiculo: { vehiculo_id: '00000000-0000-4000-8000-000000000006', placa: 'SYN-001', tipo: 'VAN' } }, progress: { total: 2, processed: 0, percentage: 0 } }] });
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: /Iniciar sesión/ }).click();
  await expect(page).toHaveURL(/\/acceso\/conductor$/);
  return { expire: () => { loggedIn = false; }, forbiddenCalls: () => forbiddenCalls, routeCalls: () => routeCalls };
}

for (const width of [390, 768, 1366, 1440]) test('panel propio responsive ' + width, async ({ page, baseURL }) => {
  await page.setViewportSize({ width, height: 900 }); const mock = await fixture(page, new URL(baseURL!).origin);
  await expect(page.getByText('Conductor de prueba', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Panel del conductor' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mis rutas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mis entregas' })).toBeVisible();
  await expect(page.getByText('SYN-001')).toBeVisible();
  await expect(page.getByText(/No tienes rutas asignadas/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width < 1024) await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('link', { name: 'Mis rutas', exact: true }).click();
  await expect(page).toHaveURL(/#mis-rutas$/);
  await expect(page.locator('#mis-rutas')).toBeFocused();
  await page.reload(); await expect(page.getByText('Conductor de prueba', { exact: true })).toBeVisible();
  await expect(page.locator('#mis-rutas')).toBeFocused();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Correo electrónico')).toHaveValue('driver@example.test');
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => ({ local: localStorage.length, session: { ...sessionStorage } }))).toEqual({ local: 0, session: { 'ecoruta.login.email': 'driver@example.test' } });
  expect(mock.forbiddenCalls()).toBe(0);
  expect(mock.routeCalls()).toBe(2);
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
const sections = [['Mi cuenta', 'mi-cuenta'], ['Mi jornada', 'mi-jornada'], ['Mis rutas', 'mis-rutas'], ['Mis entregas', 'mis-entregas']] as const;
const navigation = (page: Page) => page.getByRole('navigation', { name: 'Área del conductor' });
async function follow(page: Page, name: string, withKeyboard: boolean) {
  if (page.viewportSize()!.width < 1024) await page.getByRole('button', { name: 'Abrir menú' }).click();
  const link = navigation(page).getByRole('link', { name, exact: true });
  if (withKeyboard) { await link.focus(); await page.keyboard.press('Enter'); } else await link.click();
}
async function expectRevealed(page: Page, name: string, id: string) {
  await expect(page).toHaveURL(new RegExp(`/acceso/conductor#${id}$`));
  await expect(page.locator('#' + id)).toBeFocused();
  // En móvil el menú ya se cerró: se comprueba el enlace aunque esté oculto.
  await expect(page.locator(`#app-navigation a[href="#${id}"]`)).toHaveText(name);
  await expect(page.locator(`#app-navigation a[href="#${id}"]`)).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('#app-navigation a[aria-current="location"]')).toHaveCount(1);
  const box = await page.locator('#' + id).evaluate(el => ({ top: el.getBoundingClientRect().top, margin: Number.parseFloat(getComputedStyle(el).scrollMarginTop), y: scrollY, max: document.documentElement.scrollHeight - innerHeight, height: innerHeight }));
  // La sección queda alineada con scroll-margin-top, salvo que el documento no permita desplazarse más.
  expect(Math.abs(box.top - box.margin) <= 2 || Math.abs(box.y - box.max) <= 2 || (box.y === 0 && box.top < box.margin)).toBe(true);
  expect(box.top).toBeGreaterThanOrEqual(0);
  expect(box.top).toBeLessThan(box.height);
}
for (const [width, height, label] of [[320, 640, '320 px'], [390, 844, '390 px'], [640, 450, 'zoom 200 % de 1280 × 900'], [1440, 900, '1440 px']] as const) test('navegación interna del panel ' + label, async ({ page, baseURL }) => {
  await page.setViewportSize({ width, height }); const mock = await fixture(page, new URL(baseURL!).origin);
  await expect(page.getByText('SYN-001')).toBeVisible();
  for (const withKeyboard of [false, true]) for (const [name, id] of sections) {
    await page.evaluate(target => scrollTo(0, target === 'mi-cuenta' ? document.documentElement.scrollHeight : 0), id);
    await follow(page, name, withKeyboard);
    await expectRevealed(page, name, id);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(mock.routeCalls()).toBe(1);
  expect(mock.forbiddenCalls()).toBe(0);
});
test('recarga con hash y Atrás/Adelante enfocan la sección sin repetir solicitudes', async ({ page, baseURL }) => {
  const mock = await fixture(page, new URL(baseURL!).origin);
  await expect(page.getByText('SYN-001')).toBeVisible();
  await follow(page, 'Mi cuenta', false); await expectRevealed(page, 'Mi cuenta', 'mi-cuenta');
  await follow(page, 'Mis entregas', false); await expectRevealed(page, 'Mis entregas', 'mis-entregas');
  await page.goBack(); await expectRevealed(page, 'Mi cuenta', 'mi-cuenta');
  await page.goForward(); await expectRevealed(page, 'Mis entregas', 'mis-entregas');
  expect(mock.routeCalls()).toBe(1);
  await page.reload(); await expect(page.getByText('SYN-001')).toBeVisible();
  await expectRevealed(page, 'Mis entregas', 'mis-entregas');
  expect(mock.routeCalls()).toBe(2);
  expect(mock.forbiddenCalls()).toBe(0);
});
