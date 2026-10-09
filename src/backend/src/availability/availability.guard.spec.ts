import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AvailabilityGuard } from './availability.guard';

describe('AvailabilityGuard', () => {
  const guard = new AvailabilityGuard();

  function context(role?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: role
            ? {
                rol: {
                  nombre: role,
                },
              }
            : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('permite el acceso al Administrador', () => {
    expect(
      guard.canActivate(context('Administrador')),
    ).toBe(true);
  });

  it('permite el acceso al Operador / Técnico', () => {
    expect(
      guard.canActivate(context('Operador / Técnico')),
    ).toBe(true);
  });

  it('rechaza al Usuario Final / Conductor', () => {
    expect(() =>
      guard.canActivate(
        context('Usuario Final / Conductor'),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rechaza al Auditor Externo', () => {
    expect(() =>
      guard.canActivate(context('Auditor Externo')),
    ).toThrow(ForbiddenException);
  });

  it('rechaza una petición sin usuario autenticado', () => {
    expect(() =>
      guard.canActivate(context()),
    ).toThrow(ForbiddenException);
  });
});
