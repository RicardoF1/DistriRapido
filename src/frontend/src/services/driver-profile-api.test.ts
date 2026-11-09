import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request } from './api';
import { driverProfileApi } from './driver-profile-api';
vi.mock('./api', () => ({ request: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it('consulta perfil, lista y detalle usando solo la sesión', async () => {
  vi.mocked(request).mockResolvedValue({});
  await driverProfileApi.me(); await driverProfileApi.routes(); await driverProfileApi.route('route/id');
  expect(request).toHaveBeenNthCalledWith(1, '/driver/me', { signal: undefined });
  expect(request).toHaveBeenNthCalledWith(2, '/driver/routes', { signal: undefined });
  expect(request).toHaveBeenNthCalledWith(3, '/driver/routes/route%2Fid', { signal: undefined });
});
it('actualiza entrega con estado, causa y versión esperada', async () => {
  vi.mocked(request).mockResolvedValue({});
  await driverProfileApi.updateDelivery('stop/id', { estado: 'NO_ENTREGADA', causa: 'Ausente', expected_version: 2 });
  expect(request).toHaveBeenCalledWith('/driver/deliveries/stop%2Fid/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'NO_ENTREGADA', causa: 'Ausente', expected_version: 2 }) });
});
it('US-018: registra una incidencia sobre la entrega indicada', async () => {
  vi.mocked(request).mockResolvedValue({});
  await driverProfileApi.createIncident('stop/id', { tipo: 'OTRO', descripcion: 'Detalle' });
  expect(request).toHaveBeenCalledWith('/driver/deliveries/stop%2Fid/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'OTRO', descripcion: 'Detalle' }) });
});
describe('errores reales de rutas y entregas del conductor', () => {
  const realRequest = async (path: string) => (await vi.importActual<typeof import('./api')>('./api')).request(path, { method: 'PATCH' });
  const reply = (status: number, body?: unknown) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body === undefined ? 'sin json' : JSON.stringify(body), { status })));
  afterEach(() => vi.unstubAllGlobals());
  it('409 de /driver/deliveries conserva el mensaje del backend', async () => {
    reply(409, { statusCode: 409, message: 'El pedido debe estar EN_RUTA antes de registrarse como entregado.' });
    await expect(realRequest('/driver/deliveries/stop/status')).rejects.toMatchObject({ status: 409, message: 'El pedido debe estar EN_RUTA antes de registrarse como entregado.' });
  });
  it.each([
    [400, 'Revisa el estado y la causa de la entrega.'],
    [403, 'La entrega no existe o no está asignada a tu cuenta.'],
    [404, 'Ruta o entrega no encontrada.'],
    [409, 'La entrega cambió. Recarga la ruta antes de reintentar.'],
  ])('%s sin mensaje usa el respaldo específico', async (status, message) => {
    reply(status);
    await expect(realRequest('/driver/deliveries/stop/status')).rejects.toMatchObject({ status, message });
  });
  it('US-018: 400 de incidencias conserva un mensaje por campo', async () => {
    reply(400, { statusCode: 400, message: ['tipo: selecciona el tipo de incidencia.', 'descripcion: describe la incidencia.'] });
    await expect(realRequest('/driver/deliveries/stop/incidents')).rejects.toMatchObject({ status: 400, message: 'tipo: selecciona el tipo de incidencia.\ndescripcion: describe la incidencia.' });
    reply(400);
    await expect(realRequest('/driver/deliveries/stop/incidents')).rejects.toMatchObject({ status: 400, message: 'Revisa el tipo y la descripción de la incidencia.' });
  });
  it('aplica el mismo tratamiento a /driver/routes', async () => {
    reply(404, { message: 'La ruta no existe o no esta asignada a tu cuenta.' });
    await expect(realRequest('/driver/routes/route')).rejects.toMatchObject({ status: 404, message: 'La ruta no existe o no esta asignada a tu cuenta.' });
  });
  it('401 conserva el manejo de sesión vencida y nunca muestra el mensaje de usuarios', async () => {
    reply(401, { message: 'Sesión expirada' });
    const error = await realRequest('/driver/deliveries/stop/status').catch((cause: unknown) => cause);
    expect(error).toMatchObject({ status: 401, message: 'Credenciales incorrectas o usuario no habilitado.' });
    reply(409);
    await expect(realRequest('/driver/deliveries/stop/status')).rejects.not.toMatchObject({ message: 'Ya existe un usuario con ese correo electrónico.' });
  });
});
