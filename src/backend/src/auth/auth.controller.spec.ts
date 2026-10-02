import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRequest } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE } from './session-cookie';
describe('AuthController', () => {
  it('delega login y devuelve identidad protegida', async () => {
    const response = { accessToken: 'token', expiresIn: 900 }; const auth = { login: jest.fn().mockResolvedValue(response) };
    const controller = new AuthController(auth as unknown as AuthService, new ConfigService({ FRONTEND_ORIGIN: 'http://localhost:5173' }));
    const dto = { email: 'test@example.com', password: 'input' };
    const res = { cookie: jest.fn(), clearCookie: jest.fn() };
    expect(await controller.login(dto, { headers: {} } as Request, res as unknown as Response)).toBe(response); expect(auth.login).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(SESSION_COOKIE, 'token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 900000 });
    const user = { email: dto.email, expiresAt: Date.now() + 60000 }; expect(controller.me({ user, authToken: 'token' } as AuthRequest, res as unknown as Response)).toBe(user);
    expect(res.clearCookie).toHaveBeenCalledWith(LEGACY_SESSION_COOKIE, expect.objectContaining({ path: '/auth' }));
  });
  it('no renueva ni prolonga la caducidad al migrar cookie antigua', () => {
    const controller = new AuthController({} as AuthService, new ConfigService({ FRONTEND_ORIGIN: 'http://localhost:5173' }));
    const res = { cookie: jest.fn(), clearCookie: jest.fn() };
    controller.me({ user: { expiresAt: Date.now() - 1 }, authToken: 'token', legacySession: true } as AuthRequest, res as unknown as Response);
    expect(res.cookie).toHaveBeenCalledWith(SESSION_COOKIE, 'token', expect.objectContaining({ maxAge: 0 }));
  });
  it.each(['https', 'production'])('elimina cookie con las mismas opciones Secure: %s', (mode) => {
    const controller = new AuthController({} as AuthService, new ConfigService({ FRONTEND_ORIGIN: mode === 'https' ? 'https://app.example' : 'http://localhost:5173', NODE_ENV: mode }));
    const res = { clearCookie: jest.fn() };
    controller.logout({ headers: {} } as Request, res as unknown as Response);
    expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE, expect.objectContaining({ secure: true, httpOnly: true, path: '/', sameSite: 'lax' }));
  });
  it('permite logout desde el origen autorizado', () => {
    const controller = new AuthController({} as AuthService, new ConfigService({ FRONTEND_ORIGIN: 'http://localhost:5173' }));
    const res = { clearCookie: jest.fn() };
    controller.logout({ headers: { origin: 'http://localhost:5173', 'sec-fetch-site': 'same-site' } } as Request, res as unknown as Response);
    expect(res.clearCookie).toHaveBeenCalled();
  });
  it('permite Swagger desde el propio origen de la API', () => {
    const controller = new AuthController({} as AuthService, new ConfigService({ FRONTEND_ORIGIN: 'http://localhost:5173' }));
    const res = { clearCookie: jest.fn() };
    controller.logout({ protocol: 'http', headers: { origin: 'http://localhost:3000', host: 'localhost:3000', 'sec-fetch-site': 'same-origin' } } as Request, res as unknown as Response);
    expect(res.clearCookie).toHaveBeenCalled();
  });
  it.each([{ origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }])('rechaza origen cruzado en login/logout: %j', async (headers) => {
    const controller = new AuthController({} as AuthService, new ConfigService({ FRONTEND_ORIGIN: 'http://localhost:5173' }));
    const req = { headers } as Request;
    expect(() => controller.logout(req, {} as Response)).toThrow('Origen no permitido');
    await expect(controller.login({ email: 'test@example.com', password: 'input' }, req, {} as Response)).rejects.toThrow('Origen no permitido');
  });
});
