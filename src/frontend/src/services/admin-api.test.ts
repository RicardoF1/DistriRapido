import { vi } from 'vitest';
import { adminApi } from './admin-api';
const valid = { totalOrders: 251, pendingOrders: 2, totalUsers: 3, ordersByState: [{ state: 'PENDIENTE', count: 2 }, { state: 'OTRO_VALOR_ALMACENADO', count: 249 }] };
afterEach(() => vi.unstubAllGlobals());
it('usa cookie y única consulta de resumen sin paginar', async () => {
  const fetcher=vi.fn().mockResolvedValue({ ok: true, json: async () => valid }); vi.stubGlobal('fetch',fetcher);
  expect(await adminApi.summary()).toEqual(valid); expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/admin/summary'),expect.objectContaining({ credentials: 'include', cache: 'no-store' }));
});
it.each([null, { ...valid, totalOrders: -1 }, { ...valid, totalUsers: '3' }, { ...valid, pendingOrders: 251 }, { ...valid, ordersByState: [] }, { ...valid, ordersByState: [{ state: 'PENDIENTE', count: 251 }, { state: 'PENDIENTE', count: 0 }] }])('rechaza resumen inválido sin ceros sustitutos: %j', async data => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ ok:true,json:async()=>data })); await expect(adminApi.summary()).rejects.toThrow('no es válido');
});
