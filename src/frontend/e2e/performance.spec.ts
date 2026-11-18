import { test, expect, type Browser, type Page, type Response } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { live, median, requireLiveEnvironment } from './live-env';

// Sprint 4 · rendimiento contra el entorno levantado (no forma parte de la suite simulada).
// Web Vitals con Performance API / PerformanceObserver y tiempos de API con page.waitForResponse
// y con el cliente `request` de Playwright. Umbrales: API < 500 ms; TTFB ≤ 800 ms, FCP ≤ 1.8 s,
// LCP ≤ 2.5 s («good» según web.dev).
requireLiveEnvironment();
test.describe.configure({ mode: 'serial' });

type Vitals = { ttfb: number; fcp: number | null; lcp: number | null };
const results: { pages: Record<string, Vitals>; apiBrowser: Record<string, number>; apiDirect: Record<string, { samples: number[]; median: number }> } = { pages: {}, apiBrowser: {}, apiDirect: {} };

// Registered before any script of the page runs, so buffered LCP entries are never lost.
function observeLcp() {
  const store = window as unknown as { __lcp?: number };
  try {
    new PerformanceObserver(list => { for (const entry of list.getEntries()) store.__lcp = entry.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* engine without LCP support */ }
}

async function readVitals(page: Page): Promise<Vitals> {
  await page.waitForLoadState('load');
  return page.evaluate(() => new Promise<Vitals>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming & { activationStart?: number };
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    const lcp = (window as unknown as { __lcp?: number }).__lcp;
    resolve({ ttfb: navigation.responseStart - (navigation.activationStart ?? 0), fcp: fcp ? fcp.startTime : null, lcp: lcp ?? null });
  }))));
}

// Request duration measured by the browser (request start → last byte of the response).
const duration = (response: Response) => response.request().timing().responseEnd;
const apiResponse = (page: Page, method: string, path: RegExp) =>
  page.waitForResponse(response => response.request().method() === method && response.url().startsWith(live.api) && path.test(new URL(response.url()).pathname));

let page: Page;
let routeId = process.env.E2E_ROUTE_ID ?? '';

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(observeLcp);
  page = await context.newPage();
});

test.afterAll(async () => {
  const out = process.env.PERF_OUT;
  if (out) { mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify({ measuredAt: new Date().toISOString(), ...results }, null, 2)); }
  await page?.context().close();
});

test('login: Web Vitals de la página y tiempo de POST /auth/login', async () => {
  await page.goto('/login');
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  results.pages.login = await readVitals(page);

  await page.getByLabel('Correo electrónico').fill(live.adminEmail);
  await page.getByLabel('Contraseña', { exact: true }).fill(live.adminPassword);
  const login = apiResponse(page, 'POST', /^\/auth\/login$/);
  await page.getByRole('button', { name: /Iniciar sesión/ }).click();
  const response = await login;
  expect(response.status()).toBe(200);
  await expect(page).not.toHaveURL(/\/login$/);
  results.apiBrowser.login = duration(response);
  await test.info().attach('login.json', { body: JSON.stringify({ page: results.pages.login, api: results.apiBrowser.login }, null, 2), contentType: 'application/json' });
});

test('Seguimiento operativo: Web Vitals y tiempos de /operations/summary y /operations/routes', async () => {
  const summary = apiResponse(page, 'GET', /^\/operations\/summary$/);
  const routes = apiResponse(page, 'GET', /^\/operations\/routes$/);
  await page.goto('/seguimiento');
  const [summaryResponse, routesResponse] = await Promise.all([summary, routes]);
  expect(summaryResponse.status()).toBe(200);
  expect(routesResponse.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Seguimiento operativo', exact: true })).toBeVisible();
  await expect(page.getByText(/PRF-10\d/).first()).toBeVisible();
  results.pages.seguimiento = await readVitals(page);
  results.apiBrowser.operationsSummary = duration(summaryResponse);
  results.apiBrowser.operationsRoutes = duration(routesResponse);
  if (!routeId) routeId = ((await routesResponse.json()) as { items: { ruta_id: string }[] }).items[0]?.ruta_id ?? '';
  expect(routeId, 'se necesita al menos una ruta en operación').not.toBe('');
  await test.info().attach('seguimiento.json', { body: JSON.stringify({ page: results.pages.seguimiento, summary: results.apiBrowser.operationsSummary, routes: results.apiBrowser.operationsRoutes }, null, 2), contentType: 'application/json' });
});

test('Detalle de ruta: Web Vitals y tiempo de GET /routes/:id', async () => {
  const detail = apiResponse(page, 'GET', new RegExp(`^/routes/${routeId}$`));
  await page.goto(`/rutas/${routeId}`);
  const response = await detail;
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Detalle de recorrido', exact: true })).toBeVisible();
  await expect(page.getByText(/Dirección sintética/).first()).toBeVisible();
  results.pages.rutaDetalle = await readVitals(page);
  results.apiBrowser.routeDetail = duration(response);
  await test.info().attach('ruta-detalle.json', { body: JSON.stringify({ page: results.pages.rutaDetalle, api: results.apiBrowser.routeDetail }, null, 2), contentType: 'application/json' });
});

test('APIs clave medidas directamente con request (mediana de varias muestras)', async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: live.api });
  const time = async (call: () => Promise<{ status(): number }>, expected: number) => {
    const start = performance.now(); const response = await call(); const elapsed = performance.now() - start;
    expect(response.status()).toBe(expected); return elapsed;
  };
  const sample = async (name: string, count: number, call: () => Promise<{ status(): number }>, expected = 200) => {
    const samples: number[] = [];
    for (let i = 0; i < count; i++) samples.push(await time(call, expected));
    results.apiDirect[name] = { samples: samples.map(value => Math.round(value * 10) / 10), median: median(samples) };
  };
  // The backend throttles /auth/login and /routes/* to 10 requests per minute per client: few samples there.
  await sample('login', 3, () => api.post('/auth/login', { data: { email: live.adminEmail, password: live.adminPassword } }));
  await sample('operationsSummary', 5, () => api.get('/operations/summary'));
  await sample('operationsRoutes', 5, () => api.get('/operations/routes'));
  await sample('routeDetail', 3, () => api.get(`/routes/${routeId}`));
  await api.dispose();
  await test.info().attach('api-directa.json', { body: JSON.stringify(results.apiDirect, null, 2), contentType: 'application/json' });
});
