import { test, expect, type Page } from '@playwright/test';
const id = '00000000-0000-4000-8000-000000000001';
const uid = '00000000-0000-4000-8000-000000000002';
async function mock(page: Page, origin: string, role = 'Administrador', failure = false) {
  let signedIn = true; const calls: { path: string; body: Record<string, unknown> }[] = [];
  const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' };
  const account = { usuario_id: uid, email: 'driver-fixture@example.test', estado: 'ACTIVO', credentials_version: 0 };
  await page.route('http://localhost:3000/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (path === '/auth/me') return route.fulfill({ status: signedIn ? 200 : 401, headers, json: signedIn ? { usuario_id: uid, email: role === 'Administrador' ? 'admin-fixture@example.test' : account.email, rol: { nombre: role }, expiresAt: Date.now() + 900000 } : {} });
    if (path === `/drivers/${id}`) return route.fulfill({ headers, json: { conductor_id: id, nombre_completo: 'Conductor sintético', dni: 'fixture', telefono: 'fixture', licencia_categoria: 'PRUEBA', anios_experiencia: 0, estado: 'ACTIVO', cuenta_vinculada: true, ...(role === 'Administrador' ? { cuenta: account } : {}) } });
    if (path === `/drivers/${id}/account/credentials`) return route.fulfill({ status: failure ? 503 : 200, headers, json: failure ? { message: 'No se puede cargar la cuenta.' } : account });
    if (path.endsWith('/reset-password') || path === '/driver/account/password') {
      calls.push({ path, body: req.postDataJSON() }); if (path === '/driver/account/password') signedIn = false;
      return route.fulfill({ headers, json: { message: 'Contraseña restablecida. Las sesiones anteriores quedaron invalidadas.' } });
    }
    if (path === '/driver/me') return route.fulfill({ headers, json: { conductor_id: id, nombre_completo: 'Conductor sintético', estado: 'ACTIVO' } });
    return route.abort();
  });
  return calls;
}
for (const width of [390, 768, 1366, 1440]) test(`restablecimiento administrativo responsive ${width}`, async ({ page, baseURL }) => {
  await page.setViewportSize({ width, height: 900 }); const calls = await mock(page, new URL(baseURL!).origin);
  await page.goto(`/conductores/${id}/editar`); await page.getByLabel('Nombre completo').fill('Borrador conservado');
  await page.getByRole('button', { name: 'Restablecer contraseña', exact: true }).click();
  await expect(page.getByText('Cuenta a restablecer:')).toBeVisible();
  await page.getByLabel('Contraseña nueva', { exact: true }).fill('Una frase sintética nueva');
  await page.getByLabel('Confirmar contraseña nueva').fill('Una frase sintética nueva');
  await expect(page.getByRole('button', { name: 'Confirmar restablecimiento' })).toBeDisabled();
  await page.getByLabel(/Confirmo restablecer/).check(); await page.getByRole('button', { name: 'Confirmar restablecimiento' }).click();
  await expect(page.getByText('Contraseña restablecida. Las sesiones anteriores quedaron invalidadas.')).toBeVisible();
  expect(calls).toHaveLength(1); expect(calls[0].body).toEqual({ password: 'Una frase sintética nueva', password_confirmation: 'Una frase sintética nueva', expected_usuario_id: uid, expected_credentials_version: 0, confirmed: true });
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Borrador conservado');
  await expect(page.getByLabel('Contraseña nueva', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('Una frase sintética nueva');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('Mi cuenta exige contraseña actual y vuelve a login con confirmación', async ({ page, baseURL }) => {
  const calls = await mock(page, new URL(baseURL!).origin, 'Usuario Final / Conductor'); await page.goto('/acceso/conductor');
  await page.getByRole('button', { name: 'Cambiar mi contraseña' }).click();
  await page.getByLabel('Contraseña actual').fill('Anterior sintética de prueba');
  await page.getByLabel('Contraseña nueva', { exact: true }).fill('Una frase sintética nueva'); await page.getByLabel('Confirmar contraseña nueva').fill('Una frase sintética nueva');
  await page.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
  await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole('status')).toContainText('Contraseña actualizada');
  expect(calls[0].body).toEqual({ current_password: 'Anterior sintética de prueba', password: 'Una frase sintética nueva', password_confirmation: 'Una frase sintética nueva' });
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('sintética');
});
test('operador no tiene controles de credenciales', async ({ page, baseURL }) => {
  const calls = await mock(page, new URL(baseURL!).origin, 'Operador / Técnico'); await page.goto(`/conductores/${id}/editar`);
  await expect(page.getByText('Cuenta vinculada', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Restablecer contraseña' })).toHaveCount(0); expect(calls).toHaveLength(0);
});
test('fallo de carga impide enviar y no borra los datos del conductor', async ({ page, baseURL }) => {
  const calls = await mock(page, new URL(baseURL!).origin, 'Administrador', true); await page.goto(`/conductores/${id}/editar`);
  await page.getByRole('button', { name: 'Restablecer contraseña', exact: true }).click(); await expect(page.getByRole('alert')).toHaveText('No se puede cargar la cuenta.');
  await expect(page.getByRole('button', { name: 'Confirmar restablecimiento' })).toHaveCount(0); expect(calls).toHaveLength(0);
});
