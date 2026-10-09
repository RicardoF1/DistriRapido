import { test, expect } from '@playwright/test';
for (const width of [390, 768, 1366, 1440]) {
  test(`login con fondo ${width}`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    let authenticated = false;
    const user = { usuario_id: 'visual-test', email: 'login@example.com', rol: { nombre: 'Administrador' } };
    const headers = { 'Access-Control-Allow-Origin': new URL(baseURL!).origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    await page.route(url => url.pathname.startsWith('/auth/'), route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (new URL(route.request().url()).pathname === '/auth/login') { authenticated = true; return route.fulfill({ headers, json: { user, expiresIn: 900, accessToken: 'test-only', tokenType: 'Bearer' } }); }
      return route.fulfill({ status: authenticated ? 200 : 401, headers, json: authenticated ? { ...user, expiresAt: Date.now() + 900000 } : {} });
    });
    await page.goto('/login');
    const email = page.getByLabel('Correo electrónico');
    await expect(email).toBeVisible();
    const background = page.locator('.login-background');
    await expect(background).toHaveCSS('background-size', 'cover');
    expect(await background.evaluate(element => getComputedStyle(element).backgroundImage)).not.toContain('gradient(');
    const imageUrl = await background.evaluate(element => getComputedStyle(element).backgroundImage.match(/url\("?(.*?)"?\)/)?.[1]);
    expect(imageUrl).toBeTruthy();
    expect((await page.request.get(imageUrl!)).ok()).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('heading', { name: 'EcoRuta Huancayo' })).toHaveCount(1);
    await expect(page.locator('.brand-header')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const brand = await page.locator('.brand-header').boundingBox();
    const card = await page.locator('.auth-card').boundingBox();
    if (width >= 1024) expect(brand!.x + brand!.width).toBeLessThan(card!.x);
    else expect(brand!.y + brand!.height).toBeLessThan(card!.y);
    await page.screenshot({ path: `test-results/login-background-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.locator('#email-error')).toBeVisible();
    await email.fill(user.email);
    await page.getByLabel('Contraseña', { exact: true }).fill('frontend-test-only');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/acceso\/administrador$/);
    await expect(page.getByRole('heading', { name: /^(Panel de administración|Acceso permitido)$/ })).toBeVisible();
  });
}
