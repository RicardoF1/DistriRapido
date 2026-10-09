import { test, expect } from '@playwright/test';
for (const width of [390, 767, 768, 1023, 1024, 1366, 1440]) {
  test(`responsive ${width}: menú conserva formulario y mapa`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 900 });
    const headers = { 'Access-Control-Allow-Origin': new URL(baseURL!).origin, 'Access-Control-Allow-Credentials': 'true' };
    await page.route('**/auth/me', route => route.fulfill({ headers, json: { usuario_id: 'test-only', email: 'responsive@example.com', rol: { nombre: 'Administrador' }, expiresAt: Date.now() + 900000 } }));
    await page.route('https://tile.openstreetmap.org/**', route => route.abort());
    await page.route('https://photon.komoot.io/**', route => route.fulfill({ status: 503 }));
    await page.route('**/users', route => route.fulfill({ headers, json: [] }));
    await page.route(url => url.pathname === '/orders' || url.pathname.startsWith('/orders/'), route => route.fulfill({ headers, json: { items: [], total: 0 } }));
    await page.goto('/pedidos/nuevo');
    const name = page.getByLabel('Nombre del cliente', { exact: true });
    await name.fill('Borrador solo de prueba');
    const map = page.getByRole('region', { name: 'Mapa de ubicación de entrega' });
    const original = await map.elementHandle();
    if ([390, 768, 1366, 1440].includes(width)) await page.screenshot({ path: 'test-results/responsive-' + width + '.png', fullPage: true });
    if (width < 1024) {
      await page.getByRole('button', { name: 'Abrir menú' }).click();
      await expect(page.getByRole('navigation')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
      await expect(name).toHaveValue('Borrador solo de prueba');
      expect(await original!.evaluate(element => element.isConnected)).toBe(true);
    } else await expect(page.getByRole('navigation')).toBeVisible();
    for (const path of ['/pedidos/nuevo', '/pedidos', '/usuarios', '/acceso/administrador']) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.route('**/auth/me', route => route.fulfill({ status: 401, headers, json: {} }));
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
