import { vi } from 'vitest';
import { usersApi } from './users-api';
import { authApi } from './api';
describe('US-003 contrato HTTP', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('consulta cuentas y roles con cookie y envía PATCH sin contraseña', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }); vi.stubGlobal('fetch', fetch);
    await usersApi.list(); await usersApi.get('id'); await usersApi.roles(); await usersApi.create({ email: 'a@example.com', rol_id: 'role', estado: 'ACTIVO', password: 'initial-password' });
    await usersApi.update('id', { email: 'a@example.com', rol_id: 'role', estado: 'INACTIVO', password: 'never-send-on-edit' });
    const call = fetch.mock.calls.at(-1)!; expect(call[0]).toContain('/users/id'); expect(call[1].method).toBe('PATCH'); expect(call[1].credentials).toBe('include');
    expect(JSON.parse(call[1].body)).not.toHaveProperty('password');
  });
  it.each([403, 404, 409])('muestra mensaje controlado HTTP %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(usersApi.list()).rejects.toMatchObject({ status });
    await expect(authApi.me()).rejects.toMatchObject({ status });
  });
});
