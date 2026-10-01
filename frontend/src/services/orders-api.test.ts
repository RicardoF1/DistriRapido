import { vi } from 'vitest';
import { ordersApi } from './orders-api';
const values = { cliente: { nombre: 'Cliente', direccion: 'Destino', latitud: -12, longitud: -75 }, peso_kg: 2, volumen_m3: 0.01, ventana_inicio: '2026-10-02T09:00:00Z', ventana_fin: '2026-10-02T11:00:00Z', prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO' };
afterEach(() => vi.unstubAllGlobals());
it('POST /orders envía solo datos permitidos y cookie', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ pedido_id: 'generated' }) }); vi.stubGlobal('fetch', fetch);
  await ordersApi.create(values);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders'), expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify(values) }));
});
it.each([400, 403, 500])('mantiene HTTP %s y mensajes de registro', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
  await expect(ordersApi.create(values)).rejects.toMatchObject({ status });
});
