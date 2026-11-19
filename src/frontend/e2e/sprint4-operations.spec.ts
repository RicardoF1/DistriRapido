import { test, expect, type Page, type Route } from '@playwright/test';
// Sprint 4 (US-020 a US-023): flujos críticos con la API simulada (page.route). Datos totalmente sintéticos;
// no se escriben registros reales.
const routeId = '00000000-0000-4000-8000-000000000101';
const orderId = '00000000-0000-4000-8000-000000000102';
const result = {
  origin: { latitud: -12.068, longitud: -75.2101, label: 'Origen sintético' },
  geometry: { type: 'LineString', coordinates: [[-75.2101, -12.068], [-75.209, -12.067]] },
  return_to_origin: false, inicio: '2030-01-01T12:00:00Z', end: '2030-01-01T12:10:00Z', operational_duration_s: 600, warnings: [], confirmable: true, optimized: false,
  provenance: { provider: 'OSRM', profile: 'synthetic-test-only', revision: 'fixture', data_version: null, calculated_at: '2030-01-01T12:00:00Z' },
};
const baseRoute = {
  ruta_id: routeId, current_version: 1, creado_en: '2030-01-01T12:00:00Z', estado: 'GENERADA', conductor_id: null, asignado_en: null, conductor: null,
  confirmado_en: null, version_confirmada: null, confirmador: null, sostenibilidad: null, current_warnings: [],
  alternativa: { metodo: 'SECUENCIAL_OSRM', ejecucion: { version: { planificacion_id: routeId, planificacion: { etiqueta: 'Plan sintético Sprint 4' } } } },
  versiones: [{
    numero: 1, distancia_m: '12500', duracion_s: '900', input_hash: 'fixture', resultado: result,
    vehiculo: { placa: 'SNT-004', consumo_km_l: '10', factor_emision_kg_co2_km: '0.2' },
    paradas: [{ pedido_id: orderId, secuencia: 1, datos: { direccion: 'Destino sintético', latitud: -12.067, longitud: -75.209, arrival: '2030-01-01T12:01:00Z', service_start: '2030-01-01T12:01:00Z', departure: '2030-01-01T12:06:00Z', service_minutes: 5 }, pedido: { estado: 'PENDIENTE' } }],
  }],
};
const confirmed = { ...baseRoute, estado: 'CONFIRMADA', confirmado_en: '2030-01-01T12:20:00Z', version_confirmada: 1, confirmador: { email: 'planificador@example.test' } };
const indicators = (desde: string, hasta: string, datos = true) => ({
  periodo: { desde, hasta }, datos_suficientes: datos,
  operacion: {
    rutas_completadas: datos ? 4 : 0,
    entregas: { realizadas: datos ? 9 : 0, no_realizadas: datos ? 3 : 0, pendientes: 0, tasa_exito: datos ? 75 : null },
    incidencias: { total: datos ? 3 : 0, por_tipo: { CLIENTE_AUSENTE: datos ? 2 : 0, DIRECCION_INCORRECTA: 0, ACCESO_RESTRINGIDO: 0, VIA_BLOQUEADA: datos ? 1 : 0, VEHICULO_AVERIADO: 0, CARGA_DANADA: 0, OTRO: 0 } },
    duracion_media_min: datos ? 82.5 : null,
  },
  sostenibilidad: {
    rutas_con_registro: datos ? 2 : 0, cobertura: datos ? 50 : null, distancia_km: datos ? 25.125 : null, combustible_l: datos ? 2.5 : null,
    co2_kg: datos ? 5.025 : null, co2_por_entrega_kg: datos ? 0.8375 : null, costo_combustible: datos ? 40.5 : null, registros_con_costo: datos ? 1 : 0, origen: { ESTIMADO: datos ? 1 : 0, MEDIDO: datos ? 1 : 0 },
  },
});
const historyItem = {
  ruta_id: routeId, iniciado_en: '2030-01-02T13:00:00Z', finalizado_en: '2030-01-02T15:00:00Z',
  planificacion: { planificacion_id: routeId, etiqueta: 'Plan sintético Sprint 4' }, conductor: { conductor_id: routeId, nombre_completo: 'Conductora sintética' },
  vehiculo: { vehiculo_id: routeId, placa: 'SNT-004' }, entregas: { total: 2, realizadas: 1, no_realizadas: 1 }, incidencias: 1, con_sostenibilidad: true,
};
const historyDetail = {
  ruta_id: routeId, estado: 'COMPLETADA', creado_en: '2030-01-01T12:00:00Z', confirmado_en: '2030-01-01T12:20:00Z', confirmado_por: 'planificador@example.test', version_confirmada: 1,
  asignado_en: '2030-01-01T12:30:00Z', iniciado_en: historyItem.iniciado_en, finalizado_en: historyItem.finalizado_en, current_version: 1,
  planificacion: { planificacion_id: routeId, etiqueta: 'Plan sintético Sprint 4', version: 1 }, conductor: historyItem.conductor,
  version: { numero: 1, distancia_m: '12500', duracion_s: '900', vehiculo: { vehiculo_id: routeId, placa: 'SNT-004', tipo: 'VAN' } },
  entregas: historyItem.entregas, incidencias: 1,
  sostenibilidad: { ruta_version: 1, distancia_km: '12.5', combustible_l: '1.25', factor_emision_kg_co2_km: '0.2', emisiones_co2_kg: '2.5', origen_datos: 'MEDIDO', costo_combustible: null, observaciones: null, registrado_en: '2030-01-02T15:10:00Z', registrador: { email: 'operador@example.test' } },
  paradas: [
    { parada_id: 'p1', pedido_id: orderId, secuencia: 1, direccion: 'Destino sintético', estado_entrega: 'ENTREGADA', causa_no_entrega: null, atendido_en: '2030-01-02T14:00:00Z', incidencias: [] },
    { parada_id: 'p2', pedido_id: routeId, secuencia: 2, direccion: 'Segundo destino', estado_entrega: 'NO_ENTREGADA', causa_no_entrega: 'Cliente ausente', atendido_en: '2030-01-02T14:30:00Z', incidencias: [{ incidencia_id: 'i1', tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende', detalle_complementario: null, registrado_en: '2030-01-02T14:30:00Z' }] },
  ],
};

interface Call { method: string; path: string; search: string; body: unknown }
interface Options { role?: string; confirmFails?: boolean; route?: object }
async function mockApi(page: Page, origin: string, options: Options = {}) {
  const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PATCH', 'Access-Control-Allow-Headers': 'Content-Type,Idempotency-Key' };
  const calls: Call[] = [];
  let route: object = options.route ?? baseRoute;
  const json = (r: Route, body: unknown, status = 200) => r.fulfill({ status, headers, json: body });
  await page.route('https://tile.openstreetmap.org/**', r => r.abort());
  await page.route('http://localhost:3000/**', async r => {
    const request = r.request(); const url = new URL(request.url()); const path = url.pathname;
    if (request.method() === 'OPTIONS') return r.fulfill({ status: 204, headers });
    calls.push({ method: request.method(), path, search: url.search, body: request.postData() ? request.postDataJSON() : null });
    if (path === '/auth/me') return json(r, { usuario_id: routeId, email: 'synthetic@example.test', rol: { nombre: options.role ?? 'Operador / Técnico' }, expiresAt: Date.now() + 900000 });
    if (path === '/driver/me') return json(r, { conductor_id: routeId, nombre_completo: 'Conductor sintético', estado: 'ACTIVO' });
    if (path === '/driver/routes') return json(r, []);
    if (path === `/routes/${routeId}`) return json(r, route);
    if (path === `/routes/${routeId}/assignment-candidates`) return json(r, []);
    if (path === `/routes/${routeId}/confirmation`) {
      if (options.confirmFails) return json(r, { statusCode: 409, message: 'No se puede confirmar la ruta. Condiciones pendientes: El vehículo de la ruta no está disponible.' }, 409);
      route = confirmed;
      return json(r, { ruta_id: routeId, estado: 'CONFIRMADA', current_version: 1, confirmado_en: confirmed.confirmado_en, version_confirmada: 1, confirmador: confirmed.confirmador });
    }
    if (path === `/routes/${routeId}/sustainability`) {
      const record = { registro_id: 's1', ruta_id: routeId, ruta_version: 1, distancia_km: '12.5', combustible_l: '1.25', factor_emision_kg_co2_km: '0.2', emisiones_co2_kg: '2.5', origen_datos: 'ESTIMADO', costo_combustible: null, observaciones: null, registrado_en: '2030-01-01T12:40:00Z', vehiculo: { vehiculo_id: routeId, placa: 'SNT-004' }, registrador: { email: 'operador@example.test' } };
      route = { ...confirmed, sostenibilidad: record };
      return json(r, record, 201);
    }
    if (path === '/operations/indicators') {
      const desde = url.searchParams.get('desde') ?? '2029-12-03'; const hasta = url.searchParams.get('hasta') ?? '2030-01-01';
      return json(r, indicators(desde, hasta, desde !== '2031-01-01'));
    }
    if (path === '/operations/history') {
      const empty = url.searchParams.get('desde') === '2031-01-01';
      return json(r, { items: empty ? [] : [historyItem], total: empty ? 0 : 1, page: 1, pageSize: 12 });
    }
    if (path === `/operations/history/${routeId}`) return json(r, historyDetail);
    return r.abort();
  });
  return calls;
}
const origin = (baseURL: string | undefined) => new URL(baseURL!).origin;

test.describe('US-020 confirmar ruta', () => {
  test('confirma una ruta revisada y habilita la asignación', async ({ page, baseURL }) => {
    const calls = await mockApi(page, origin(baseURL));
    await page.goto(`/rutas/${routeId}`);
    const panel = page.getByRole('group', { name: 'Confirmar ruta' });
    await expect(panel).toBeVisible();
    await expect(page.getByText('Confirma la ruta antes de asignarle un conductor.')).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Confirmar ruta' })).toBeDisabled();
    await panel.getByRole('checkbox').check();
    await panel.getByRole('button', { name: 'Confirmar ruta' }).click();
    await expect(page.getByText(/^Ruta confirmada el .+; ya puedes asignar un conductor\.$/)).toBeVisible();
    await expect(page.getByRole('group', { name: 'Asignar conductor' })).toBeVisible();
    await expect(page.getByText('planificador@example.test')).toBeVisible();
    const confirmation = calls.find(call => call.path.endsWith('/confirmation'));
    expect(confirmation).toMatchObject({ method: 'PATCH', body: { expected_estado: 'GENERADA', confirmed: true } });
  });

  test('muestra las condiciones pendientes que devuelve el backend', async ({ page, baseURL }) => {
    await mockApi(page, origin(baseURL), { confirmFails: true });
    await page.goto(`/rutas/${routeId}`);
    const panel = page.getByRole('group', { name: 'Confirmar ruta' });
    await panel.getByRole('checkbox').check();
    await panel.getByRole('button', { name: 'Confirmar ruta' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Condiciones pendientes' });
    await expect(alert).toContainText('El vehículo de la ruta no está disponible.');
    await expect(alert.getByRole('button', { name: 'Recargar ruta' })).toBeVisible();
  });
});

test.describe('US-021 registrar sostenibilidad', () => {
  test('precarga los datos, exige el origen y registra la información', async ({ page, baseURL }) => {
    const calls = await mockApi(page, origin(baseURL), { route: confirmed });
    await page.goto(`/rutas/${routeId}`);
    await expect(page.getByLabel('Distancia recorrida (km) *')).toHaveValue('12.5');
    await expect(page.getByLabel('Combustible consumido (L) *')).toHaveValue('1.25');
    await expect(page.getByLabel('Factor de emisión (kg CO₂/km) *')).toHaveValue('0.2');
    await page.getByRole('button', { name: 'Registrar sostenibilidad' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'origen de los datos' })).toBeVisible();
    expect(calls.some(call => call.path.endsWith('/sustainability'))).toBe(false);
    await page.getByLabel('Origen de los datos *').selectOption('ESTIMADO');
    await page.getByRole('button', { name: 'Registrar sostenibilidad' }).click();
    await expect(page.getByText(/^Información de sostenibilidad registrada el /)).toBeVisible();
    expect(calls.find(call => call.path.endsWith('/sustainability'))).toMatchObject({ method: 'POST', body: { distancia_km: 12.5, combustible_l: 1.25, factor_emision_kg_co2_km: 0.2, origen_datos: 'ESTIMADO' } });
  });
});

test.describe('US-022 consultar indicadores', () => {
  test('muestra los indicadores y consulta el periodo elegido', async ({ page, baseURL }) => {
    const calls = await mockApi(page, origin(baseURL));
    await page.goto('/indicadores');
    await expect(page.getByRole('heading', { name: 'Indicadores de la operación', level: 1 })).toBeVisible();
    const operation = page.getByRole('region', { name: 'Operación' });
    await expect(operation.getByText('Tasa de entregas exitosas').locator('xpath=following-sibling::dd[1]')).toHaveText('75 %');
    await expect(page.getByRole('region', { name: 'Sostenibilidad' }).getByText('Emisiones de CO₂').locator('xpath=following-sibling::dd[1]')).toHaveText('5.025 kg');
    await expect(page.getByRole('region', { name: 'Tabla de incidencias por tipo' }).getByRole('row', { name: /Cliente ausente/ })).toContainText('2');
    await page.getByLabel('Desde').fill('2030-06-01');
    await page.getByLabel('Hasta').fill('2030-06-30');
    await page.getByRole('button', { name: 'Consultar periodo' }).click();
    await expect(page).toHaveURL(/\/indicadores\?desde=2030-06-01&hasta=2030-06-30$/);
    await expect(page.getByText('Periodo del 01/06/2030 al 30/06/2030.')).toBeVisible();
    expect(calls.filter(call => call.path === '/operations/indicators').map(call => call.search)).toContain('?desde=2030-06-01&hasta=2030-06-30');
  });

  test('sin datos suficientes no muestra ceros engañosos', async ({ page, baseURL }) => {
    await mockApi(page, origin(baseURL));
    await page.goto('/indicadores?desde=2031-01-01&hasta=2031-01-05');
    await expect(page.getByText(/No existen datos suficientes para presentar indicadores en este periodo/)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Operación' }).getByText('Tasa de entregas exitosas').locator('xpath=following-sibling::dd[1]')).toHaveText('Sin datos suficientes');
  });
});

test.describe('US-023 consultar historial', () => {
  test('lista las operaciones terminadas y abre su trazabilidad', async ({ page, baseURL }) => {
    await mockApi(page, origin(baseURL));
    await page.goto('/historial');
    const table = page.getByRole('region', { name: 'Tabla del historial de operaciones' });
    await expect(table.getByRole('row', { name: /Conductora sintética/ })).toContainText('SNT-004');
    const open = page.getByRole('button', { name: /Ver detalle de la operación SNT-004/ });
    await open.click();
    await expect(page.getByRole('heading', { name: 'Detalle de la operación · SNT-004' })).toBeFocused();
    const timeline = page.getByRole('list', { name: 'Línea de tiempo de la operación' });
    await expect(timeline.getByRole('listitem')).toHaveCount(5);
    await expect(timeline).toContainText('Por planificador@example.test · versión 1');
    await expect(page.getByText('Causa de no entrega: Cliente ausente')).toBeVisible();
    await expect(page.getByText('Medido en la operación')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar detalle' }).click();
    await expect(open).toBeFocused();
  });

  test('un periodo sin operaciones informa que no hay registros', async ({ page, baseURL }) => {
    await mockApi(page, origin(baseURL));
    await page.goto('/historial?desde=2031-01-01&hasta=2031-01-31');
    await expect(page.getByText('No existen registros para los criterios seleccionados. Ajusta o limpia los filtros para continuar.')).toBeVisible();
    await expect(page.getByLabel('Finalizada desde')).toHaveValue('2031-01-01');
  });
});

for (const path of ['/indicadores', '/historial']) {
  test(`el conductor no accede a ${path}`, async ({ page, baseURL }) => {
    await mockApi(page, origin(baseURL), { role: 'Usuario Final / Conductor' });
    await page.goto(path);
    await expect(page).toHaveURL(/\/acceso\//);
    await expect(page.getByRole('link', { name: 'Indicadores' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Historial' })).toHaveCount(0);
  });
}
