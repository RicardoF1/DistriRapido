import { test, expect, type Page } from '@playwright/test';
const id = '00000000-0000-4000-8000-000000000001';
const account = { usuario_id: '00000000-0000-4000-8000-000000000002', email: 'eligible@example.test', estado: 'ACTIVO' };
async function mock(page: Page, origin: string, role = 'Administrador', linked = false, failed = false) {
  const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' };
  let driver = { conductor_id: id, nombre_completo: 'Conductor sintético', dni: 'fixture', licencia_categoria: 'PRUEBA', telefono: 'fixture', anios_experiencia: 0, estado: 'ACTIVO', cuenta_vinculada: linked, cuenta: linked ? { ...account, usuario_id: '00000000-0000-4000-8000-000000000003', email: 'current@example.test' } : null };
  const calls: { method: string; body: Record<string, unknown> }[] = [];
  // Catch-all prevents any unmocked backend read or mutation from reaching real data.
  await page.route('http://localhost:3000/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (path === '/auth/me') return route.fulfill({ headers, json: { usuario_id: id, email: 'admin@example.test', rol: { nombre: role }, expiresAt: Date.now() + 900000 } });
    if (path === '/drivers/account-options') return route.fulfill({ status: failed ? 503 : 200, headers, json: failed ? { message: 'No se pudieron cargar las cuentas.' } : { items: [account], total: 1, page: 1, pageSize: 20 } });
    if (path === `/drivers/${id}/account`) {
      const body = req.postDataJSON(); calls.push({ method: req.method(), body });
      if (role !== 'Administrador') return route.fulfill({ status: 403, headers, json: { message: 'Sin permisos.' } });
      if (driver.cuenta && body.confirm_replacement !== true) return route.fulfill({ status: 409, headers, json: { message: 'Confirma la sustitución.' } });
      driver = { ...driver, cuenta_vinculada: true, cuenta: req.method() === 'POST' ? { ...account, email: body.email } : account };
      return route.fulfill({ status: req.method() === 'POST' ? 201 : 200, headers, json: driver });
    }
    if (path === `/drivers/${id}`) return route.fulfill({ headers, json: role === 'Administrador' ? driver : { ...driver, cuenta: undefined } });
    return route.abort();
  });
  return calls;
}
for (const width of [390, 768, 1366, 1440]) test(`selector de cuenta responsive ${width}`, async ({ page, baseURL }) => {
  await page.setViewportSize({ width, height: 900 }); const calls = await mock(page, new URL(baseURL!).origin);
  await page.goto(`/conductores/${id}/editar`);
  await expect(page.getByLabel(/UUID/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Vincular cuenta existente' }).click();
  await page.getByLabel('Cuenta elegible').selectOption(account.usuario_id);
  await page.getByRole('button', { name: 'Vincular cuenta', exact: true }).click();
  await expect(page.getByText(account.email, { exact: true })).toBeVisible();
  expect(calls).toEqual([{ method: 'PUT', body: { usuario_id: account.usuario_id, expected_usuario_id: null, confirm_replacement: false } }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('sustitución exige confirmación y preserva el borrador de la ficha', async ({ page, baseURL }) => {
  const calls = await mock(page, new URL(baseURL!).origin, 'Administrador', true);
  await page.goto(`/conductores/${id}/editar`); await page.getByLabel('Nombre completo').fill('Borrador conservado');
  await page.getByRole('button', { name: 'Cambiar cuenta vinculada' }).click();
  await page.getByLabel('Cuenta elegible').selectOption(account.usuario_id);
  await expect(page.getByRole('button', { name: 'Vincular cuenta', exact: true })).toBeDisabled(); expect(calls).toHaveLength(0);
  await page.getByLabel('Confirmo sustituir la cuenta vinculada.').check();
  await page.getByRole('button', { name: 'Vincular cuenta', exact: true }).click();
  await expect(page.getByText('Cuenta de acceso actualizada correctamente.')).toBeVisible();
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Borrador conservado');
  expect(calls[0].body.expected_usuario_id).toBe('00000000-0000-4000-8000-000000000003');
});
test('creación expresa sin persistir contraseña en navegador', async ({ page, baseURL }) => {
  const calls = await mock(page, new URL(baseURL!).origin); await page.goto(`/conductores/${id}/editar`);
  await page.getByRole('button', { name: 'Crear cuenta de conductor', exact: true }).click();
  await page.getByLabel('Correo de acceso').fill('new@example.test');
  await page.getByLabel('Contraseña nueva', { exact: true }).fill('fixture-password-123');
  await page.getByLabel('Confirmar contraseña nueva').fill('fixture-password-123');
  await page.getByRole('button', { name: 'Crear y vincular cuenta' }).click();
  await expect(page.getByText('new@example.test', { exact: true })).toBeVisible();
  expect(calls).toHaveLength(1); expect(calls[0].method).toBe('POST');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('fixture-password-123');
  await expect(page.getByLabel('Contraseña nueva', { exact: true })).toHaveCount(0);
});
test('operador solo ve existencia del vínculo', async ({ page, baseURL }) => {
  const calls = await mock(page, new URL(baseURL!).origin, 'Operador / Técnico', true); await page.goto(`/conductores/${id}/editar`);
  await expect(page.getByText('Cuenta vinculada', { exact: true })).toBeVisible();
  await expect(page.getByText('current@example.test')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /cuenta/ })).toHaveCount(0); expect(calls).toHaveLength(0);
});
test('error de opciones no elimina vínculo ni borra el formulario', async ({ page, baseURL }) => {
  const calls = await mock(page, new URL(baseURL!).origin, 'Administrador', true, true); await page.goto(`/conductores/${id}/editar`);
  await page.getByLabel('Nombre completo').fill('Borrador conservado');
  await page.getByRole('button', { name: 'Cambiar cuenta vinculada' }).click();
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByText('current@example.test')).toBeVisible();
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Borrador conservado'); expect(calls).toHaveLength(0);
});
