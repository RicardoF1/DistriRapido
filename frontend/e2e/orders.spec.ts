import { test, expect } from '@playwright/test';
const api = process.env.E2E_API_URL ?? 'http://localhost:3000';
for (const role of ['admin', 'operator'] as const) {
  test(`US-004: ${role} registra pedido; conserva borrador/foco y sesión/F5/logout`, async ({ page, context }) => {
    const email = role === 'admin' ? process.env.E2E_LOGIN_EMAIL : process.env.E2E_OPERATOR_EMAIL;
    const password = role === 'admin' ? process.env.E2E_LOGIN_PASSWORD : process.env.E2E_OPERATOR_PASSWORD;
    if (!email || !password) throw new Error('Configura cuentas exclusivas E2E.');
    await page.goto('/login'); await page.getByLabel('Correo electrónico').fill(email); await page.getByLabel('Contraseña', { exact: true }).fill(password); await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Acceso permitido' })).toBeVisible(); await page.getByRole('link', { name: 'Registrar pedido', exact: true }).click();
    await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click(); await expect(page.getByText('Selecciona una prioridad permitida.')).toBeVisible();
    await page.getByLabel('Nombre del cliente').fill('Cliente E2E US-004'); await page.getByLabel('Dirección de entrega').fill('Destino E2E');
    await page.getByLabel('Latitud', { exact: true }).fill('-12.065'); await page.getByLabel('Longitud', { exact: true }).fill('-75.204'); await page.getByLabel('Peso (kg)').fill('2.5'); await page.getByLabel('Volumen (m³)').fill('0.015');
    await page.getByLabel('Inicio de ventana de entrega').fill('2026-10-02T09:00'); await page.getByLabel('Fin de ventana de entrega').fill('2026-10-02T11:00');
    await page.getByLabel('Prioridad', { exact: true }).selectOption('ESTANDAR'); await page.getByLabel('Tipo de producto').selectOption('NO_PERECEDERO');
    const identity = page.waitForResponse(r => r.url().endsWith('/auth/me') && r.status() === 200); await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await identity;
    await expect(page.getByLabel('Nombre del cliente')).toHaveValue('Cliente E2E US-004');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('formulario-pedido.png'), fullPage: true });
    let requests = 0; let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/orders', async route => { requests++; await gate; await route.continue(); });
    const response = page.waitForResponse(r => r.url().endsWith('/orders') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Registrar pedido', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Registrando pedido…' })).toBeDisabled();
    await page.getByRole('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); release();
    expect((await response).status()).toBe(201); await expect(page.getByText('Pedido registrado correctamente')).toBeVisible(); expect(requests).toBe(1);
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('registrar-pedido.png'), fullPage: true });
    await page.reload(); await expect(page.getByRole('form', { name: 'Registrar pedido' })).toBeVisible(); await expect(page.getByLabel('Nombre del cliente')).toHaveValue('');
    expect((await context.request.get(`${api}/auth/me`)).status()).toBe(200);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click(); await expect(page).toHaveURL(/\/login$/); await page.goto('/pedidos/nuevo'); await expect(page).toHaveURL(/\/login$/);
  });
}
