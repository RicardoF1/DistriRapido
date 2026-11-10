import { beforeEach, expect, it, vi } from 'vitest';
import { request } from './api';
import { operationsApi, operationsQuery } from './operations-api';

vi.mock('./api', () => ({ request: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(request).mockResolvedValue({}); });

it('US-019: construye la consulta solo con los filtros indicados', () => {
  expect(operationsQuery({}, 1)).toBe('page=1&pageSize=12');
  expect(operationsQuery({ estado: 'EN_CURSO', estado_entrega: 'NO_ENTREGADA', desde: '2030-03-01', hasta: '2030-03-31', con_incidencias: true, search: '  ABC  ' }, 2))
    .toBe('page=2&pageSize=12&estado=EN_CURSO&estado_entrega=NO_ENTREGADA&desde=2030-03-01&hasta=2030-03-31&con_incidencias=true&search=ABC');
  expect(operationsQuery({ con_incidencias: false, search: '   ' }, 1)).toBe('page=1&pageSize=12');
});

it('US-019: consulta resumen, listado y detalle de solo lectura', async () => {
  await operationsApi.summary();
  await operationsApi.list({ estado: 'ASIGNADA' }, 1);
  await operationsApi.detail('ruta/1');
  expect(request).toHaveBeenNthCalledWith(1, '/operations/summary', { signal: undefined });
  expect(request).toHaveBeenNthCalledWith(2, '/operations/routes?page=1&pageSize=12&estado=ASIGNADA', { signal: undefined });
  expect(request).toHaveBeenNthCalledWith(3, '/operations/routes/ruta%2F1', { signal: undefined });
});
