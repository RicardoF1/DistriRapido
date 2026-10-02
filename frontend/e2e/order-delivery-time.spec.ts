import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'Asia/Tokyo' });
test('US-004 fecha/hora separadas conservan Lima incluso con navegador en otra zona', async ({ page, baseURL }) => {
  const headers = { 'Access-Control-Allow-Origin': new URL(baseURL!).origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  const user = { usuario_id: 'time-contract-user', email: 'time@example.com', rol: { rol_id: 'time-contract-role', nombre: 'Administrador' }, expiresAt: Date.now() + 900000 };
  await page.route('**/auth/me', route => route.fulfill({ status: 200, headers, json: user }));
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL2cAAAAASUVORK5CYII=', 'base64') }));
  await page.route('https://photon.komoot.io/**', route => route.fulfill({ status: 503, body: '' }));
  let submissions = 0;
  await page.route('**/orders', async route => {
    if (route.request().method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    submissions++;
    const body = route.request().postDataJSON();
    expect(body.ventana_inicio).toBe('2026-10-02T14:00:00-05:00'); expect(body.ventana_fin).toBe('2026-10-02T20:00:00-05:00');
    await route.fulfill({ status: 201, headers, json: { pedido_id: 'time-contract-order', estado: 'PENDIENTE' } });
  });
  await page.goto('/pedidos/nuevo');
  await page.getByLabel('Nombre del cliente').fill('Cliente fecha'); await page.getByLabel('Dirección de entrega').fill('Destino fecha');
  await page.getByRole('region', { name: 'Mapa de ubicación de entrega' }).click(); await page.getByLabel('Peso (kg)').fill('2');
  await page.getByLabel('Prioridad', { exact: true }).selectOption('ESTANDAR'); await page.getByLabel('Tipo de producto').selectOption('NO_PERECEDERO');
  await expect(page.locator('input[type="datetime-local"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
  for (const part of ['fecha de inicio', 'hora de inicio', 'fecha de fin', 'hora de fin']) await expect(page.getByText(`Selecciona una ${part} válida.`)).toBeVisible();
  for (const label of ['Hora de inicio', 'Hora de fin']) {
    const input = page.getByLabel(label);
    await input.pressSequentially('32'); await expect(input).toHaveValue('3');
    await input.fill('12:75'); await expect(input).toHaveValue('3');
    await input.clear();
  }
  await page.getByLabel('Fecha de inicio').fill('2026-10-02'); await page.getByLabel('Hora de inicio').fill('09:00'); await page.getByLabel('Fecha de fin').fill('2026-10-02');
  for (const time of ['09:00', '08:59']) {
    await page.getByLabel('Hora de fin').fill(time); await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
    await expect(page.getByText('El fin de la ventana de entrega debe ser posterior al inicio.')).toBeVisible(); expect(submissions).toBe(0);
  }
  await page.getByLabel('Hora de fin').fill('01:30');
  await page.getByLabel('AM/PM de fin').selectOption('PM');
  await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
  await expect(page.getByText(/Hora de fin fuera de atención/)).toBeVisible(); expect(submissions).toBe(0);
  await page.getByLabel('Hora de inicio').fill('02:00'); await page.getByLabel('AM/PM de inicio').selectOption('PM');
  await page.getByLabel('Hora de fin').fill('08:00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
  await expect(page.getByText('Pedido registrado correctamente')).toBeVisible(); expect(submissions).toBe(1);
});
