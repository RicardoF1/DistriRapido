import { vi } from 'vitest';
import { ordersApi } from './orders-api';
const values = { cliente: { nombre: 'Cliente', direccion: 'Destino', latitud: -12, longitud: -75 }, peso_kg: 2, volumen_m3: 0.01, ventana_inicio: '2026-10-02T09:00:00Z', ventana_fin: '2026-10-02T11:00:00Z', prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO' };
afterEach(() => vi.unstubAllGlobals());
it('GET listado codifica filtros y paginación; detalle incluye cookie y signal', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }) }); vi.stubGlobal('fetch', fetch);
  const signal = new AbortController().signal;
  await ordersApi.list({ search: 'Mantaro & Giraldez', estado: '', prioridad: 'ESTANDAR', tipo_producto: '', page: 2, pageSize: 20 }, signal);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.searchParams.get('search')).toBe('Mantaro & Giraldez'); expect(url.searchParams.get('page')).toBe('2'); expect(url.searchParams.has('estado')).toBe(false);
  expect(fetch.mock.calls[0][1]).toMatchObject({ signal, credentials: 'include', cache: 'no-store' });
  await ordersApi.get('id/con espacio', signal); expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/orders/id%2Fcon%20espacio'), expect.objectContaining({ signal, credentials: 'include' }));
});
it('POST /orders envía solo datos permitidos y cookie', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ pedido_id: 'generated' }) }); vi.stubGlobal('fetch', fetch);
  await ordersApi.create(values);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders'), expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify(values) }));
});
it.each([400, 403, 500])('mantiene HTTP %s y mensajes de registro', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
  await expect(ordersApi.create(values)).rejects.toMatchObject({ status });
});
it.each([[400, 'Revisa los criterios de consulta del pedido.'], [403, 'No tienes permisos para consultar pedidos.'], [404, 'Pedido no encontrado.']])('GET consulta traduce HTTP %s sin errores técnicos', async (status, message) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
  await expect(ordersApi.get('test-id')).rejects.toMatchObject({ status, message });
});
