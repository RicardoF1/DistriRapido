import { test, expect, type Page } from '@playwright/test';
async function session(page: Page, baseURL: string, role = 'Administrador') {
  let active = true;
  const headers = { 'Access-Control-Allow-Origin': new URL(baseURL).origin, 'Access-Control-Allow-Credentials': 'true' };
  await page.route('**/auth/me', route => route.fulfill({ status: active ? 200 : 401, headers, json: active ? { usuario_id: 'welcome-test', email: 'admin@example.com', rol: { nombre: role }, expiresAt: Date.now() + 900000 } : { message: 'Sin sesión' } }));
  await page.route('**/auth/logout', route => { active = false; return route.fulfill({ status: 204, headers }); });
  await page.route('**/admin/summary', route => route.fulfill({ headers, json: { totalOrders: 0, pendingOrders: 0, totalUsers: 0, ordersByState: [] } }));
  await page.route('**/users', route => route.fulfill({ headers, json: [] }));
  await page.route('**/orders?**', route => route.fulfill({ headers, json: { items: [], total: 0, page: 1, pageSize: 20 } }));
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
}
for (const width of [390, 768, 1366, 1440]) {
  test(`panel administrador ${width}: tarjetas, navegación y logout`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 900 }); await session(page, baseURL!);
    const calls: string[] = [];
    page.on('request', request => { if (new URL(request.url()).port === '3000') calls.push(new URL(request.url()).pathname); });
    await page.goto('/acceso/administrador');
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
    const shortcuts = page.getByRole('navigation', { name: 'Accesos rápidos' });
    await expect(shortcuts.getByRole('link')).toHaveCount(3);
    await expect(page.locator('main').getByText('admin@example.com', { exact: true })).toHaveCount(0);
    await expect(page.locator('header').getByText('admin@example.com', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resumen general' })).toBeVisible();
    expect(calls.every(path => ['/auth/me', '/admin/summary'].includes(path))).toBe(true);
    const columns = await shortcuts.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 1024 ? 3 : width >= 768 ? 2 : 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const card = shortcuts.getByRole('link', { name: 'Usuarios y roles' }); await card.focus(); await expect(card).toBeFocused();
    await page.screenshot({ path: `test-results/admin-welcome-${width}.png`, fullPage: true });
    await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/usuarios$/);
    for (const [name, path] of [['Registrar pedido', '/pedidos/nuevo'], ['Consultar pedidos', '/pedidos']] as const) {
      await page.goto('/acceso/administrador'); await page.getByRole('navigation', { name: 'Accesos rápidos' }).getByRole('link', { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
    await page.getByRole('button', { name: 'Cerrar sesión' }).click(); await expect(page).toHaveURL(/\/login$/);
    await page.goto('/acceso/administrador'); await expect(page).toHaveURL(/\/login$/);
  });
}
for (const role of ['Operador / Técnico', 'Usuario Final / Conductor', 'Auditor Externo']) {
  test(`${role}: conserva permisos y contenido de acceso`, async ({ page, baseURL }) => {
    await session(page, baseURL!, role); await page.goto('/acceso/administrador');
    await expect(page.getByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Usuarios y roles' })).toHaveCount(0);
    await expect(page.getByText('Cuenta', { exact: true })).toBeVisible();
    await page.goto('/usuarios'); await expect(page.getByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
  });
}
