import { test, expect, type Page } from '@playwright/test';
const sample = { totalOrders: 2, pendingOrders: 2, totalUsers: 2, ordersByState: [{ state: 'PENDIENTE', count: 2 }] };
async function identity(page: Page, baseURL: string, role = 'Administrador') {
  const headers = { 'Access-Control-Allow-Origin': new URL(baseURL).origin, 'Access-Control-Allow-Credentials': 'true' };
  await page.route('**/auth/me', route => route.fulfill({ headers, json: { usuario_id: 'summary-test', email: 'admin@example.com', rol: { nombre: role }, expiresAt: Date.now() + 900000 } }));
  return headers;
}
for (const width of [390, 768, 1366, 1440]) {
  test('resumen responsive ' + width, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 900 }); const headers=await identity(page,baseURL!);let calls=0;
    await page.route('**/admin/summary', route => { calls++;return route.fulfill({ headers,json:sample }); });
    await page.goto('/acceso/administrador');
    await expect(page.getByText('Pedidos registrados', {exact:true})).toBeVisible();
    await expect(page.locator('.admin-metric dd')).toHaveText(['2','2','2']);
    await expect(page.getByRole('navigation', { name: 'Accesos rápidos' }).getByRole('link')).toHaveCount(3);
    await expect(page.locator('.admin-state-summary')).toContainText('PENDIENTE');expect(calls).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const columns=await page.locator('.admin-metrics').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);expect(columns).toBe(width>=1024?3:width>=768?2:1);
    await page.screenshot({path:'test-results/admin-summary-'+width+'.png',fullPage:true});
  });
}
test('carga, error sin ceros y reintento', async ({page,baseURL}) => {
  const headers=await identity(page,baseURL!);let calls=0;let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/admin/summary',async route=>{calls++;if(calls===1){await gate;await route.fulfill({status:500,headers,json:{message:'Error'}});}else await route.fulfill({headers,json:{totalOrders:0,pendingOrders:0,totalUsers:0,ordersByState:[]}});});
  await page.goto('/acceso/administrador');await expect(page.getByText('Cargando indicadores…')).toBeVisible();expect(await page.locator('.admin-metric dd').count()).toBe(0);
  release();await expect(page.getByRole('alert')).toContainText('No se pudo cargar');expect(await page.locator('.admin-metric dd').count()).toBe(0);
  await page.getByRole('button',{name:'Reintentar resumen'}).click();await expect(page.locator('.admin-metric dd')).toHaveText(['0','0','0']);await expect(page.getByText('No hay pedidos registrados.')).toBeVisible();expect(calls).toBe(2);
});
for(const role of ['Operador / Técnico','Usuario Final / Conductor','Auditor Externo'])test('no solicita resumen para '+role,async({page,baseURL})=>{
  await identity(page,baseURL!,role);let calls=0;await page.route('**/admin/summary',route=>{calls++;return route.abort();});await page.goto('/acceso/administrador');await expect(page.getByRole('heading',{name:'Acceso permitido'})).toBeVisible();await expect(page.getByRole('heading',{name:'Resumen general'})).toHaveCount(0);expect(calls).toBe(0);
});
