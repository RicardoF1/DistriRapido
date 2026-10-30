import { test, expect } from '@playwright/test';

test('correo sobrevive navegación, recarga y cierre de sesión; contraseña no se almacena', async ({ page, baseURL }) => {
  const email = 'fixture@example.com';
  const user = { usuario_id: '00000000-0000-4000-8000-000000000001', email, rol: { rol_id: '00000000-0000-4000-8000-000000000002', nombre: 'Administrador' } };
  let loggedIn = false;
  const headers = { 'Access-Control-Allow-Origin': new URL(baseURL!).origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST' };
  await page.route('http://localhost:3000/auth/**', async route => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.url().endsWith('/login')) {
      expect(request.postDataJSON()).toEqual({ email, password: 'fixture-password' });
      loggedIn = true;
      return route.fulfill({ headers, json: { user, expiresIn: 900, tokenType: 'Bearer', accessToken: 'synthetic-test-token' } });
    }
    if (request.url().endsWith('/logout')) { loggedIn = false; return route.fulfill({ status: 204, headers }); }
    return route.fulfill({ status: loggedIn ? 200 : 401, headers, json: loggedIn ? { ...user, expiresAt: Date.now() + 900000 } : {} });
  });
  await page.route('**/admin/summary', route => route.fulfill({ headers, json: { totalOrders: 0, pendingOrders: 0, totalUsers: 0, ordersByState: [] } }));
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('fixture-password');
  await page.goto('/acceso/administrador');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Correo electrónico')).toHaveValue(email);
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('Correo electrónico')).toHaveValue(email);
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  await page.getByLabel('Contraseña', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: /Iniciar sesión/ }).click();
  await expect(page).toHaveURL(/\/acceso\/administrador$/);
  if (test.info().project.name === 'mobile') await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Correo electrónico')).toHaveValue(email);
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => ({ local: localStorage.length, session: { ...sessionStorage } }))).toEqual({ local: 0, session: { 'ecoruta.login.email': email } });
});
