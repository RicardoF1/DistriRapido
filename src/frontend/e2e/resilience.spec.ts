import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { live, requireLiveEnvironment } from './live-env';

// Sprint 4 · disponibilidad y resiliencia contra el entorno levantado (no forma parte de la suite simulada).
// 1) Códigos HTTP reales del backend (200, 400, 401, 403, 404, 409).
// 2) Mensajes de la interfaz cuando la API falla (page.route con abort o 500), sobre una sesión real.
requireLiveEnvironment();
test.describe.configure({ mode: 'serial' });

const frontendOrigin = () => new URL(process.env.E2E_BASE_URL ?? 'http://localhost:5173').origin;
const unknownId = randomUUID();

test.describe('códigos HTTP de la API', () => {
  let admin: APIRequestContext;
  let anonymous: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    admin = await playwright.request.newContext({ baseURL: live.api });
    anonymous = await playwright.request.newContext({ baseURL: live.api });
  });
  test.afterAll(async () => { await admin?.dispose(); await anonymous?.dispose(); });

  test('200: login válido y consultas de seguimiento con sesión', async () => {
    const login = await admin.post('/auth/login', { data: { email: live.adminEmail, password: live.adminPassword } });
    expect(login.status()).toBe(200);
    expect(login.headers()['set-cookie']).toContain('HttpOnly');
    expect((await admin.get('/operations/summary')).status()).toBe(200);
    expect((await admin.get('/operations/routes')).status()).toBe(200);
  });

  test('400: datos inválidos se rechazan con mensaje', async () => {
    const login = await anonymous.post('/auth/login', { data: { email: 'no-es-un-correo', password: '' } });
    expect(login.status()).toBe(400);
    const filter = await admin.get('/operations/routes?estado=INEXISTENTE');
    expect(filter.status()).toBe(400);
    expect((await filter.json()).message).toBeTruthy();
  });

  test('401: sin sesión o con credenciales incorrectas', async () => {
    expect((await anonymous.get('/operations/summary')).status()).toBe(401);
    const wrong = await anonymous.post('/auth/login', { data: { email: live.adminEmail, password: `${live.adminPassword}-incorrecta` } });
    expect(wrong.status()).toBe(401);
  });

  test('403: rol sin permiso y origen no permitido', async ({ playwright }) => {
    test.skip(!live.driverEmail || !live.driverPassword, 'Faltan E2E_DRIVER_EMAIL / E2E_DRIVER_PASSWORD.');
    const driver = await playwright.request.newContext({ baseURL: live.api });
    expect((await driver.post('/auth/login', { data: { email: live.driverEmail, password: live.driverPassword } })).status()).toBe(200);
    expect((await driver.get('/operations/summary')).status()).toBe(403);
    await driver.dispose();
    const foreign = await anonymous.post('/auth/login', { headers: { Origin: 'https://origen-no-permitido.example' }, data: { email: live.adminEmail, password: live.adminPassword } });
    expect(foreign.status()).toBe(403);
  });

  test('404: ruta inexistente', async () => {
    expect((await admin.get(`/routes/${unknownId}`)).status()).toBe(404);
    expect((await admin.get(`/operations/routes/${unknownId}`)).status()).toBe(404);
  });

  test('409: confirmar una ruta que ya fue asignada', async () => {
    const assigned = await admin.get('/operations/routes?estado=ASIGNADA&pageSize=1');
    const routeId = ((await assigned.json()) as { items: { ruta_id: string }[] }).items[0]?.ruta_id;
    test.skip(!routeId, 'No hay rutas ASIGNADA en el entorno.');
    const response = await admin.patch(`/routes/${routeId}/confirmation`, { headers: { Origin: frontendOrigin() }, data: { expected_estado: 'GENERADA', confirmed: true } });
    expect(response.status()).toBe(409);
    expect((await response.json()).message).toBeTruthy();
  });
});

test.describe('la interfaz ante fallos de la API', () => {
  let context: BrowserContext;
  let page: Page;
  // Only API requests are intercepted, never the frontend's own JS chunks.
  const apiPath = (path: RegExp) => (url: URL) => url.origin === new URL(live.api).origin && path.test(url.pathname);

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    // context.request shares the cookie jar with the pages: a single real login for every test.
    const login = await context.request.post(`${live.api}/auth/login`, { data: { email: live.adminEmail, password: live.adminPassword } });
    expect(login.status()).toBe(200);
    page = await context.newPage();
  });
  test.afterEach(async () => { await page.unrouteAll({ behavior: 'ignoreErrors' }); });
  test.afterAll(async () => { await context?.close(); });

  test('sin conexión con la API, Seguimiento operativo informa y permite reintentar', async () => {
    await page.route(apiPath(/^\/operations\//), route => route.abort('connectionrefused'));
    await page.goto('/seguimiento');
    await expect(page.getByRole('heading', { name: 'Seguimiento operativo', exact: true })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo conectar al servidor. Inténtalo de nuevo.' }).first()).toBeVisible();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.getByRole('button', { name: 'Reintentar consulta' }).click();
    await expect(page.getByText(/PRF-10\d/).first()).toBeVisible();
  });

  test('error 500 del backend en el listado de seguimiento muestra el mensaje del servidor', async () => {
    // Same JSON body as the backend's global HttpExceptionFilter for an unexpected error.
    await page.route(apiPath(/^\/operations\/routes$/), route => route.fulfill({
      status: 500, headers: { 'Access-Control-Allow-Origin': frontendOrigin(), 'Access-Control-Allow-Credentials': 'true' },
      json: { statusCode: 500, message: 'No se pudo completar la solicitud.', path: '/operations/routes', timestamp: new Date().toISOString() },
    }));
    await page.goto('/seguimiento');
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo completar la solicitud.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar consulta' })).toBeVisible();
    await expect(page.getByText(/Error:|at \w+ \(|stack/i)).toHaveCount(0);
  });

  test('error 500 sin cuerpo JSON en el detalle de ruta muestra un mensaje genérico', async () => {
    await page.route(apiPath(/^\/routes\/[0-9a-f-]{36}$/), route => route.fulfill({
      status: 500, headers: { 'Access-Control-Allow-Origin': frontendOrigin(), 'Access-Control-Allow-Credentials': 'true' },
      contentType: 'text/html', body: '<html><body>Bad gateway</body></html>',
    }));
    await page.goto(`/rutas/${unknownId}`);
    await expect(page.getByRole('heading', { name: 'Detalle de recorrido', exact: true })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo completar la operación de rutas.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar consulta' })).toBeVisible();
  });

  test('login sin conexión con la API informa al usuario', async ({ browser }) => {
    const anonymous = await browser.newContext();
    const login = await anonymous.newPage();
    await login.route(apiPath(/^\/auth\/login$/), route => route.abort('connectionrefused'));
    await login.goto('/login');
    await login.getByLabel('Correo electrónico').fill(live.adminEmail);
    await login.getByLabel('Contraseña', { exact: true }).fill(live.adminPassword);
    await login.getByRole('button', { name: /Iniciar sesión/ }).click();
    await expect(login.getByText('No se pudo conectar al servidor. Inténtalo de nuevo.')).toBeVisible();
    await expect(login).toHaveURL(/\/login$/);
    await anonymous.close();
  });
});
