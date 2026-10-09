import { test, expect, type Page } from '@playwright/test';
// Plaza coordinates observed in a read-only Photon response; other points are approved geometry fixtures.
const destinations = [
  { name: 'Plaza de la Constitución', coords: [-75.2100731, -12.0680457], district: 'HUANCAYO' },
  { name: 'Destino El Tambo', coords: [-75.14734221422972, -11.972179979999964], district: 'EL TAMBO' },
  { name: 'Destino Chilca', coords: [-75.18256836234613, -12.077792229999943], district: 'CHILCA' },
];
async function setup(page: Page, baseURL: string) {
  const headers = { 'Access-Control-Allow-Origin': new URL(baseURL).origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  await page.route('**/auth/me', route => route.fulfill({ headers, json: { usuario_id: 'marker-test', email: 'marker@example.com', rol: { nombre: 'Administrador' }, expiresAt: Date.now() + 900000 } }));
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  return headers;
}
const feature = (item: typeof destinations[number]) => ({ geometry: { type: 'Point', coordinates: item.coords }, properties: { name: item.name, city: 'Huancayo', state: 'Junín' } });
async function centered(page: Page) {
  const marker = page.locator('.delivery-marker');
  await expect(marker).toBeVisible();
  await expect.poll(async () => {
    const box = (await marker.boundingBox())!;
    const map = (await page.locator('.delivery-map').boundingBox())!;
    return Math.abs(box.x + box.width / 2 - map.x - map.width / 2) + Math.abs(box.y + box.height / 2 - map.y - map.height / 2);
  }).toBeLessThan(3);
  const box = (await marker.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThan(page.viewportSize()!.height);
  await expect(page.locator('.leaflet-tile-pane img').first()).toHaveAttribute('src', /\/17\//);
}
for (const destination of destinations) {
  test(`selección ${destination.district} centra marcador; repetir destino tras Ver cobertura`, async ({ page, baseURL }) => {
    await setup(page, baseURL!);
    await page.route('https://photon.komoot.io/**', route => route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { features: [feature(destination)] } }));
    await page.goto('/pedidos/nuevo');
    const address = page.getByLabel('Dirección de entrega'); await address.fill(destination.name);
    const suggestion = page.getByRole('button', { name: new RegExp(`^${destination.name}`) }); await expect(suggestion).toBeVisible();
    await expect(page.locator('.delivery-marker')).toHaveCount(0);
    await expect(page.getByText('Ubicación confirmada.', { exact: true })).toHaveCount(0);
    await suggestion.focus(); await page.keyboard.press('Enter');
    await expect(page.getByText('Ubicación confirmada.', { exact: true })).toBeVisible(); await centered(page);
    await page.getByRole('button', { name: 'Ver cobertura' }).click();
    await address.fill(destination.name); await suggestion.click(); await centered(page);
    await expect(page.locator('.delivery-marker')).toHaveCount(1);
  });
}
async function fields(page: Page) {
  await page.getByLabel('Nombre del cliente').fill('Cliente de prueba');
  await page.getByLabel('Peso (kg)').fill('2');
  await page.getByLabel('Fecha de inicio').fill('2026-10-02'); await page.getByLabel('Hora de inicio').fill('09:00');
  await page.getByLabel('Fecha de fin').fill('2026-10-02'); await page.getByLabel('Hora de fin').fill('11:00');
  await page.getByLabel('Prioridad', { exact: true }).selectOption('ESTANDAR'); await page.getByLabel('Tipo de producto').selectOption('NO_PERECEDERO');
}
test('clic y arrastre confirman las coordenadas reales del marcador enviadas al formulario', async ({ page, baseURL }) => {
  const headers = await setup(page, baseURL!);
  let lastPoint: { latitud: number; longitud: number } | undefined; let reverses = 0; let posts = 0;
  await page.route('https://photon.komoot.io/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('reverse')) { reverses++; lastPoint = { latitud: Number(url.searchParams.get('lat')), longitud: Number(url.searchParams.get('lon')) }; }
    return route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { features: [feature(destinations[0])] } });
  });
  await page.route('**/orders', route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    posts++; expect(route.request().postDataJSON().cliente).toMatchObject(lastPoint!);
    return route.fulfill({ status: 201, headers, json: { pedido_id: 'marker-test-order', estado: 'PENDIENTE' } });
  });
  await page.goto('/pedidos/nuevo'); await fields(page);
  await page.getByLabel('Dirección de entrega').fill('Plaza Constitución');
  await page.getByRole('button', { name: /^Plaza de la Constitución/ }).click(); await centered(page);
  const map = page.locator('.delivery-map'); const box = (await map.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2 + 20, box.y + box.height / 2 + 20);
  await expect.poll(() => reverses).toBe(1); await expect(page.getByText('Ubicación confirmada.', { exact: true })).toBeVisible();
  const marker = page.locator('.delivery-marker'); await marker.hover(); const before = (await marker.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2); await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 35, before.y + before.height / 2 + 10, { steps: 8 }); await page.mouse.up();
  await expect.poll(() => reverses).toBe(2); await expect(page.getByText('Ubicación confirmada.', { exact: true })).toBeVisible();
  expect(lastPoint).not.toEqual({ latitud: -12.068046, longitud: -75.210073 });
  await expect(marker).not.toHaveClass(/outside|unconfirmed/);
  await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
  await expect(page.getByText('Pedido registrado correctamente')).toBeVisible(); expect(posts).toBe(1);
});
test('editar y errores Photon no conservan confirmación falsa ni permiten POST', async ({ page, baseURL }) => {
  await setup(page, baseURL!); let failing = false; let posts = 0;
  await page.route('https://photon.komoot.io/**', route => failing ? route.fulfill({ status: 503, headers: { 'Access-Control-Allow-Origin': '*' } }) : route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { features: [feature(destinations[0])] } }));
  await page.route('**/orders', route => { posts++; return route.abort(); });
  await page.goto('/pedidos/nuevo'); await fields(page);
  const address = page.getByLabel('Dirección de entrega'); await address.fill('Plaza Constitución');
  await page.getByRole('button', { name: /^Plaza de la Constitución/ }).click(); await centered(page);
  failing = true; await address.fill('Otra dirección nueva');
  await expect(page.getByText('Ubicación confirmada.', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Error de búsqueda/)).toBeVisible();
  const map = page.locator('.delivery-map'); await map.click({ position: { x: 60, y: 80 } });
  await expect(page.getByText(/No se pudo obtener la dirección/)).toBeVisible();
  await expect(page.getByText('Ubicación confirmada.', { exact: true })).toHaveCount(0);
  await expect(page.locator('.delivery-marker')).toHaveClass(/unconfirmed/);
  await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
  await expect(page.getByText('Selecciona un punto de entrega válido en el mapa.')).toBeVisible(); expect(posts).toBe(0);
});
