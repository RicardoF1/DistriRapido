import { test, expect } from '@playwright/test';
const id = '10000000-0000-4000-8000-000000000001';
const order = { pedido_id: id, cliente_id: id, peso_kg: '2.5', volumen_m3: null, descripcion_carga: 'Caja', estado: 'PENDIENTE', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', creado_en: '2026-10-01T12:00:00Z', ventana_inicio: '2026-10-02T14:00:00Z', ventana_fin: '2026-10-02T16:00:00Z', cliente: { nombre: 'Comercial Mantaro', direccion: 'Av. Giraldez', referencia: 'Puerta azul', telefono: null, email: null } };
test.use({ timezoneId: 'Asia/Tokyo' });
test('US-005 consulta, filtros, paginación y detalle de solo lectura', async ({ page, baseURL }) => {
  const headers = { 'Access-Control-Allow-Origin': new URL(baseURL!).origin, 'Access-Control-Allow-Credentials': 'true' };
  await page.route('**/auth/me', route => route.fulfill({ headers, json: { usuario_id: id, email: 'query@example.com', rol: { nombre: 'Operador / Técnico' }, expiresAt: Date.now() + 900000 } }));
  const queries: URLSearchParams[] = []; const mutations: string[] = [];
  await page.route(url => url.pathname === '/orders' || url.pathname.startsWith('/orders/'), route => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET') { mutations.push(route.request().method()); return route.abort(); }
    if (url.pathname === `/orders/${id}`) return route.fulfill({ headers, json: order });
    const params = url.searchParams; queries.push(params);
    const empty = params.get('search') === 'sin coincidencias';
    return route.fulfill({ headers, json: { items: empty ? [] : [order], total: empty ? 0 : 21, page: Number(params.get('page') || 1), pageSize: 20 } });
  });
  await page.goto('/pedidos'); await expect(page.getByRole('heading', { name: 'Consultar pedidos' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible(); await expect(page.getByRole('cell', { name: 'No informado', exact: true })).toBeVisible();
  await expect(page.getByText(/02\/10\/2026 09:00 AM/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Siguiente' }).click(); await expect(page.getByText(/Página 2 de 2/)).toBeVisible();
  await page.getByLabel('Buscar cliente, dirección o ID').fill('sin coincidencias');
  await expect(page.getByText('No se encontraron pedidos con los criterios seleccionados.')).toBeVisible();
  await page.getByLabel('Estado', { exact: true }).selectOption('PENDIENTE');
  await page.getByLabel('Prioridad', { exact: true }).selectOption('ESTANDAR');
  await page.getByLabel('Tipo de producto').selectOption('NO_PERECEDERO');
  await expect.poll(() => queries.at(-1)?.get('tipo_producto')).toBe('NO_PERECEDERO');
  expect(queries.at(-1)?.get('search')).toBe('sin coincidencias'); expect(queries.at(-1)?.get('estado')).toBe('PENDIENTE');
  await page.getByRole('button', { name: 'Limpiar filtros' }).click(); await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('link', { name: `Ver detalle de ${id}` }).click(); await expect(page.getByRole('heading', { name: 'Detalle del pedido' })).toBeVisible();
  await expect(page.getByText('Puerta azul')).toBeVisible(); await expect(page.getByText('Caja', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Editar|Eliminar|Cancelar|Cambiar estado/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload(); await expect(page.getByText('Puerta azul')).toBeVisible();
  expect(mutations).toEqual([]);
});
for (const role of ['Usuario Final / Conductor', 'Auditor Externo']) {
  test(`US-005 bloquea URL directa para ${role}`, async ({ page, baseURL }) => {
    const headers = { 'Access-Control-Allow-Origin': new URL(baseURL!).origin, 'Access-Control-Allow-Credentials': 'true' };
    await page.route('**/auth/me', route => route.fulfill({ headers, json: { usuario_id: id, email: 'noaccess@example.com', rol: { nombre: role }, expiresAt: Date.now() + 900000 } }));
    let queries = 0; await page.route(url => url.pathname === '/orders' || url.pathname.startsWith('/orders/'), route => { queries++; return route.abort(); });
    await page.goto(`/pedidos/${id}`); await expect(page.getByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Consultar pedidos' })).toHaveCount(0); expect(queries).toBe(0);
  });
}
