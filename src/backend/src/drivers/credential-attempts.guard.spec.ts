import type { ExecutionContext } from '@nestjs/common';
import { CredentialAttemptsGuard } from './credential-attempts.guard';
function context(actor: string, target?: string) { return { switchToHttp: () => ({ getRequest: () => ({ user: { usuario_id: actor }, params: { id: target } }) }) } as ExecutionContext; }
describe('Límite adicional de credenciales', () => {
  afterEach(() => jest.restoreAllMocks());
  it('limita actor aunque cambie destinatario y vuelve a permitir tras un minuto', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000); const guard = new CredentialAttemptsGuard();
    for (let n = 0; n < 5; n++) expect(guard.canActivate(context('actor', String(n)))).toBe(true);
    expect(() => guard.canActivate(context('actor', 'nuevo'))).toThrow('Demasiados intentos');
    clock.mockReturnValue(61001); expect(guard.canActivate(context('actor', 'nuevo'))).toBe(true);
  });
  it('limita destinatario aunque cambie actor', () => {
    const guard = new CredentialAttemptsGuard(); for (let n = 0; n < 5; n++) guard.canActivate(context(String(n), 'cuenta'));
    expect(() => guard.canActivate(context('otro', 'cuenta'))).toThrow('Demasiados intentos');
  });
});
