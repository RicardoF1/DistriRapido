import { ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
describe('Protección JWT', () => {
  const auth = { authenticate: jest.fn() };
  const guard = new JwtAuthGuard(auth as unknown as AuthService);
  function context(authorization?: string) {
    const request = { headers: { authorization } };
    return { request, ctx: { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext };
  }
  it.each([undefined, '', 'Basic abc', 'Bearer ', 'Bearer abc def'])('rechaza cabecera %s', async (header) => {
    await expect(guard.canActivate(context(header).ctx)).rejects.toThrow('Debes iniciar sesión');
  });
  it('adjunta identidad validada', async () => {
    const user = { email: 'test@example.com' }; auth.authenticate.mockResolvedValue(user);
    const { request, ctx } = context('Bearer valid'); expect(await guard.canActivate(ctx)).toBe(true);
    expect(request).toHaveProperty('user', user);
  });
  it('acepta cookie HttpOnly y mantiene precedencia de Bearer', async () => {
    const { request, ctx } = context();
    Object.assign(request.headers, { cookie: 'other=a; distrirapido_session=valid-cookie' });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(auth.authenticate).toHaveBeenLastCalledWith('valid-cookie');
    request.headers.authorization = 'Bearer api-token';
    await guard.canActivate(ctx); expect(auth.authenticate).toHaveBeenLastCalledWith('api-token');
  });
});
