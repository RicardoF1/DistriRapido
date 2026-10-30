import { beforeEach, expect, it, vi } from 'vitest';
import { request } from './api';
import { driverProfileApi } from './driver-profile-api';
vi.mock('./api', () => ({ request: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it('consulta perfil, lista y detalle usando solo la sesiÃ³n', async () => {
  vi.mocked(request).mockResolvedValue({});
  await driverProfileApi.me(); await driverProfileApi.routes(); await driverProfileApi.route('route/id');
  expect(request).toHaveBeenNthCalledWith(1, '/driver/me', { signal: undefined });
  expect(request).toHaveBeenNthCalledWith(2, '/driver/routes', { signal: undefined });
  expect(request).toHaveBeenNthCalledWith(3, '/driver/routes/route%2Fid', { signal: undefined });
});
it('actualiza entrega con estado, causa y versiÃ³n esperada', async () => {
  vi.mocked(request).mockResolvedValue({});
  await driverProfileApi.updateDelivery('stop/id', { estado: 'NO_ENTREGADA', causa: 'Ausente', expected_version: 2 });
  expect(request).toHaveBeenCalledWith('/driver/deliveries/stop%2Fid/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'NO_ENTREGADA', causa: 'Ausente', expected_version: 2 }) });
});