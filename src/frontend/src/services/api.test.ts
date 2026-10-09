import { vi } from 'vitest';
import { authApi, ApiError, request } from './api';
import { loginResponse } from '../test/fixtures';
describe('Contrato de API', () => {
  it.each(['/users', '/roles'])('no confunde endpoint inexistente %s con usuario inexistente', async (path) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(request(path, {})).rejects.toEqual(new ApiError(`La ruta ${path} no está disponible en el servidor. Comprueba que el backend esté actualizado.`, 404));
  });
  it('conserva 404 de un usuario específico inexistente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(request('/users/missing-id', {})).rejects.toEqual(new ApiError('Usuario no encontrado.', 404));
  });
  afterEach(() => vi.unstubAllGlobals());
  it('envía JSON y cookies a la API sin almacenar JWT', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => loginResponse }); vi.stubGlobal('fetch', fetch);
    expect(await authApi.login({ email: 'test@example.com', password: 'input' })).toEqual(loginResponse);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }));
    await authApi.me(); expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/auth/me'), expect.objectContaining({ credentials: 'include', cache: 'no-store' }));
  });
  it.each([401, 429, 500, 400])('maneja HTTP %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(authApi.login({ email: 'test@example.com', password: 'input' })).rejects.toMatchObject({ status });
  });
  it('maneja fallo de red sin exponer detalles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('internal')));
    await expect(authApi.me()).rejects.toEqual(new ApiError('No se pudo conectar al servidor. Inténtalo de nuevo.', 0));
  });
  it('logout envía POST con cookies y acepta 204 sin JSON', async () => {
    const json = vi.fn(); const fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json }); vi.stubGlobal('fetch', fetch);
    await expect(authApi.logout()).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.objectContaining({ method: 'POST', credentials: 'include' }));
    expect(json).not.toHaveBeenCalled();
  });
});

it('registro HTTP 503 informa cobertura no disponible sin fingir éxito', async () => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:503}));
  try { await expect(request('/orders',{method:'POST'})).rejects.toEqual(new ApiError('La cobertura geográfica no está disponible o no pudo verificarse. No se puede registrar el pedido.',503)); } finally { vi.unstubAllGlobals(); }
});
