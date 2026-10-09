import { test, expect } from '@playwright/test';
async function session(page: import('@playwright/test').Page, baseURL: string) {
  const headers = { 'Access-Control-Allow-Origin': new URL(baseURL).origin, 'Access-Control-Allow-Credentials': 'true' };
  await page.route('**/auth/me', route => route.fulfill({ headers, json: { usuario_id: 'coverage-test', email: 'coverage@example.com', rol: { nombre: 'Administrador' }, expiresAt: Date.now() + 900000 } }));
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
}
for (const width of [390, 768, 1366, 1440]) {
  test(`cobertura responsive ${width}, Photon ambiguo y selección`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 900 }); await session(page, baseURL!);
    let searches = 0;
    await page.route('https://photon.komoot.io/**', route => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/api')) { searches++; expect(url.searchParams.get('countrycode')).toBe('PE'); expect(url.searchParams.get('q')).toBe('Tambo'); }
      return route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { features: [
        { geometry: { type: 'Point', coordinates: [-75.5,-11.775] }, properties: { name: 'El Tambo de Jauja', county: 'Jauja' } },
        { geometry: { type: 'Point', coordinates: [-75.147342,-11.97218] }, properties: { name: 'El Tambo', county: 'Huancayo', state: 'Junín', country: 'Perú' } },
      ] } });
    });
    await page.goto('/pedidos/nuevo');
    const show = page.getByRole('button', { name: 'Ver cobertura' }); await expect(show).toBeEnabled();
    await expect(page.getByRole('list', { name: 'Distritos autorizados' }).locator('li')).toHaveCount(5);
    const map = page.getByRole('region', { name: 'Mapa de ubicación de entrega' });
    const box = (await map.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(width >= 1024 ? 560 : width >= 768 ? 480 : 400);
    const section = (await page.locator('.delivery-location').boundingBox())!;
    const details = (await page.locator('.order-details').boundingBox())!;
    const left = (await page.locator('.order-details-column').boundingBox())!;
    const right = (await page.locator('.order-details > fieldset').boundingBox())!;
    expect(section.y).toBeGreaterThanOrEqual(details.y + details.height);
    if (width >= 1024) { expect(right.x).toBeGreaterThan(left.x + left.width); expect(Math.abs(right.y - left.y)).toBeLessThan(12); }
    else expect(right.y).toBeGreaterThanOrEqual(left.y + left.height);
    expect(box.width).toBeGreaterThan(section.width - 40);
    const submit = (await page.getByRole('button', { name: 'Registrar pedido', exact: true }).boundingBox())!;
    expect(Math.abs(submit.x + submit.width - details.x - details.width)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const address = page.getByLabel('Dirección de entrega'); await address.fill('Tambo');
    await expect(page.getByRole('button', { name: /^El Tambo, Huancayo/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Jauja/ })).toHaveCount(0);
    await expect(address).toHaveValue('Tambo'); expect(searches).toBe(1);
    await page.getByRole('button', { name: /^El Tambo, Huancayo/ }).click();
    await expect(page.getByText('Ubicación confirmada.', { exact: true })).toBeVisible();
    await show.click(); await expect(page.locator('.delivery-marker')).toHaveCount(1);
    await page.screenshot({ path: `test-results/coverage-${width}.png`, fullPage: true });
  });
}
test('arrastre fuera de cobertura invalida y bloquea POST', async ({ page, baseURL }) => {
  await session(page, baseURL!);
  await page.route('https://photon.komoot.io/**', route => route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { features: [{ geometry: { coordinates: [-75.204,-12.065] }, properties: { name: 'Destino', city: 'Huancayo' } }] } }));
  let posts = 0; await page.route('**/orders', route => { posts++; return route.abort(); });
  await page.goto('/pedidos/nuevo');
  await expect(page.getByRole('button', { name: 'Ver cobertura' })).toBeEnabled();
  await page.getByLabel('Dirección de entrega').fill('Destino');
  await page.getByRole('button', { name: /^Destino, Huancayo/ }).click();
  await expect(page.getByText('Ubicación confirmada.', { exact: true })).toBeVisible();
  const zoomOut = page.getByRole('button', { name: 'Zoom out' });
  for (let i=0; i<7; i++) { await zoomOut.click(); await page.waitForTimeout(300); await expect(page.locator('.leaflet-zoom-anim')).toHaveCount(0); }
  await page.locator('.delivery-marker').hover();
  const marker = page.locator('.delivery-marker'); const box = (await marker.boundingBox())!;
  await page.mouse.move(box.x+14,box.y+14); await page.mouse.down();
  await page.mouse.move(box.x+220,box.y+14,{steps:8}); await page.mouse.up();
  await expect(marker).toHaveClass(/delivery-marker-outside/);
  await expect(page.getByText('Ubicación confirmada.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
  await expect(page.getByText('Selecciona un destino dentro de la cobertura autorizada.')).toBeVisible(); expect(posts).toBe(0);
});
test('fallo de carga impide confirmación por clic y teclado', async ({ page, baseURL }) => {
  await session(page, baseURL!);
  await page.route(url => url.pathname.endsWith('/coverage.geojson'), route => route.request().resourceType() === 'fetch' ? route.abort() : route.continue());
  await page.goto('/pedidos/nuevo');
  await expect(page.getByText(/No se pudo cargar o verificar la cobertura/)).toBeVisible();
  const map = page.getByRole('region', { name: 'Mapa de ubicación de entrega' });
  await map.click(); await map.focus(); await page.keyboard.press('Enter');
  await expect(page.getByText('Ubicación confirmada.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ver cobertura' })).toBeDisabled();
});
