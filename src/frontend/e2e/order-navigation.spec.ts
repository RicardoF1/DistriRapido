import { test, expect } from '@playwright/test';
// Frontend navigation regression: API contracts are intercepted; no DB fixtures or writes.
for (const role of ['Administrador', 'Operador / Técnico', 'Usuario Final / Conductor', 'Auditor Externo']) {
  test(`US-004 navegación: ${role}`, async ({ page, baseURL }) => {
    let authenticated = false; let userRequests = 0;
    const user = { usuario_id: 'navigation-test-user', email: 'navigation@example.com', rol: { rol_id: 'navigation-role', nombre: role } };
    const headers = { 'Access-Control-Allow-Origin': new URL(baseURL ?? 'http://localhost:5173').origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    await page.route(url => url.pathname.startsWith('/auth/'), async route => {
      if (route.request().method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
      const path = new URL(route.request().url()).pathname;
      if (path === '/auth/login') { authenticated = true; await route.fulfill({ status: 200, headers, json: { user, expiresIn: 900, accessToken: 'frontend-contract-fixture', tokenType: 'Bearer' } }); }
      else if (path === '/auth/logout') { authenticated = false; await route.fulfill({ status: 204, headers }); }
      else await route.fulfill({ status: authenticated ? 200 : 401, headers, json: authenticated ? { ...user, expiresAt: Date.now() + 900000 } : { message: 'Sin sesión' } });
    });
    await page.route('**/users', async route => {
      userRequests++;
      await route.fulfill({ status: role === 'Administrador' ? 200 : 403, headers, json: [{ ...user, rol_id: user.rol.rol_id, estado: 'ACTIVO', creado_en: new Date().toISOString() }] });
    });
    await page.goto('/login'); await page.getByLabel('Correo electrónico').fill(user.email); await page.getByLabel('Contraseña', { exact: true }).fill('frontend-test-only'); await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { name: role === 'Administrador' ? 'Panel de administración' : 'Acceso permitido' })).toBeVisible();
    const allowed = role === 'Administrador' || role === 'Operador / Técnico';
    if (!allowed) {
      await expect(page.locator('main').getByRole('link', { name: 'Registrar pedido', exact: true })).toHaveCount(0);
      await page.goto('/pedidos/nuevo'); await expect(page.getByRole('heading', { name: role === 'Administrador' ? 'Panel de administración' : 'Acceso permitido' })).toBeVisible(); await expect(page.getByRole('form')).toHaveCount(0);
      expect(userRequests).toBe(0);
    } else {
      await expect(page.locator('main').getByRole('link', { name: 'Registrar pedido', exact: true })).toBeVisible();
      if (role === 'Administrador') {
        await page.getByRole('link', { name: 'Usuarios y roles' }).click(); await expect(page).toHaveURL(/\/usuarios$/); await expect(page.getByRole('table')).toBeVisible();
        const navigation = page.getByRole('navigation', { name: 'Administración' });
        const menu = page.getByRole('button', { name: 'Abrir menú' });
        if (await menu.isVisible()) await menu.click();
        await expect(navigation.getByRole('link', { name: 'Acceso', exact: true })).toBeVisible(); await expect(navigation.getByRole('link', { name: 'Usuarios', exact: true })).toBeVisible();
        await navigation.getByRole('link', { name: 'Registrar pedido', exact: true }).click();
      } else {
        await expect(page.getByRole('link', { name: 'Usuarios y roles' })).toHaveCount(0); await page.locator('main').getByRole('link', { name: 'Registrar pedido', exact: true }).click();
        await expect(page.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0); expect(userRequests).toBe(0);
      }
      await expect(page).toHaveURL(/\/pedidos\/nuevo$/); await expect(page.getByRole('form', { name: 'Registrar pedido' })).toBeVisible();
      for (const label of ['Nombre del cliente', 'Dirección de entrega', 'Peso (kg)', 'Volumen (m³) — opcional', 'Fecha de inicio', 'Hora de inicio', 'Fecha de fin', 'Hora de fin', 'Prioridad', 'Tipo de producto']) await expect(page.getByLabel(label, { exact: true })).toBeVisible();
      await page.getByLabel('Nombre del cliente').fill('Borrador en memoria');
      const checked = page.waitForResponse(response => response.url().endsWith('/auth/me') && response.status() === 200);
      await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await checked; await expect(page.getByLabel('Nombre del cliente')).toHaveValue('Borrador en memoria');
      await page.reload(); await expect(page.getByRole('form')).toBeVisible(); await expect(page.getByLabel('Nombre del cliente')).toHaveValue('');
      expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
    }
    await page.getByRole('button', { name: 'Cerrar sesión' }).click(); await expect(page).toHaveURL(/\/login$/); await page.goto('/pedidos/nuevo'); await expect(page).toHaveURL(/\/login$/);
  });
}
