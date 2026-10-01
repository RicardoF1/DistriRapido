import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdministratorGuard } from '../auth/administrator.guard';
import { RequestOriginGuard } from './request-origin';
const ctx = (request: unknown) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;
describe('US-003 autorización/origen', () => {
  it('permite Administrador y rechaza otros roles', () => {
    const guard = new AdministratorGuard();
    expect(guard.canActivate(ctx({ user: { rol: { nombre: 'Administrador' } } }))).toBe(true);
    expect(() => guard.canActivate(ctx({ user: { rol: { nombre: 'Operador / Técnico' } } }))).toThrow('Solo el Administrador');
  });
  it('GET seguro y escrituras con origen confiable; bloquea origen ajeno', () => {
    const guard = new RequestOriginGuard(new ConfigService({ FRONTEND_ORIGIN: 'http://localhost:5173' }));
    expect(guard.canActivate(ctx({ method: 'GET' }))).toBe(true);
    expect(guard.canActivate(ctx({ method: 'POST', headers: { origin: 'http://localhost:5173' } }))).toBe(true);
    expect(() => guard.canActivate(ctx({ method: 'PATCH', headers: { origin: 'https://evil.example' } }))).toThrow('Origen no permitido');
  });
});
