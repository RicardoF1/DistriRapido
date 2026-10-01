import { randomBytes, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { UsersService } from '../users/users.service';
import { ROLE_NAMES } from '../roles/roles';

describe('US-001 AuthService', () => {
  const id = randomUUID();
  const user = { usuario_id: id, email: 'test@example.com', password_hash: 'hash', estado: 'ACTIVO', rol: { rol_id: randomUUID(), nombre: ROLE_NAMES.administrator } };
  const users = { findByEmail: jest.fn(), findById: jest.fn() };
  const passwords = { verify: jest.fn() };
  let jwt: JwtService;
  let service: AuthService;
  beforeEach(() => {
    jest.resetAllMocks();
    jwt = new JwtService({ secret: randomBytes(48).toString('hex') });
    service = new AuthService(users as unknown as UsersService, passwords as unknown as PasswordService, jwt, new ConfigService({ JWT_EXPIRES_SECONDS: 900 }));
    users.findByEmail.mockResolvedValue(user); users.findById.mockResolvedValue(user); passwords.verify.mockResolvedValue(true);
  });
  it('permite acceso y emite JWT verificable sin exponer el hash', async () => {
    const result = await service.login({ email: user.email, password: 'input' });
    expect(result.user).toEqual({ usuario_id: id, email: user.email, rol: user.rol });
    expect(result.expiresIn).toBe(900); expect(result).not.toHaveProperty('password_hash');
    const payload = await jwt.verifyAsync(result.accessToken, { issuer: 'distrirapido', audience: 'distrirapido-web' });
    expect(payload.sub).toBe(id); expect(payload.exp - payload.iat).toBe(900);
    expect(await service.authenticate(result.accessToken)).toEqual({ ...result.user, expiresAt: payload.exp * 1000 });
  });
  it('rechaza contraseña incorrecta', async () => {
    passwords.verify.mockResolvedValue(false);
    await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rechaza usuario inexistente y verifica contra el hash ficticio', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: user.email, password: 'input' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwords.verify).toHaveBeenCalledWith(null, 'input');
  });
  it.each(['INACTIVO', 'BLOQUEADO'])('rechaza estado %s', async (estado) => {
    users.findByEmail.mockResolvedValue({ ...user, estado });
    await expect(service.login({ email: user.email, password: 'input' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rechaza un rol fuera de la línea base', async () => {
    users.findByEmail.mockResolvedValue({ ...user, rol: { ...user.rol, nombre: 'No permitido' } });
    await expect(service.login({ email: user.email, password: 'input' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rechaza JWT inválido', async () => { await expect(service.authenticate('invalid')).rejects.toBeInstanceOf(UnauthorizedException); });
  it.each([undefined, 42, 'not-a-uuid'])('rechaza sub inválido: %s', async (sub) => {
    const token = await jwt.signAsync({ sub }, { issuer: 'distrirapido', audience: 'distrirapido-web', expiresIn: 900 });
    await expect(service.authenticate(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it.each([null, { ...user, estado: 'INACTIVO' }, { ...user, rol: { ...user.rol, nombre: 'No permitido' } }])('comprueba usuario y rol vigentes', async (current) => {
    const result = await service.login({ email: user.email, password: 'input' }); users.findById.mockResolvedValue(current);
    await expect(service.authenticate(result.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rechaza JWT expirado', async () => {
    const token = await jwt.signAsync({ sub: id }, { issuer: 'distrirapido', audience: 'distrirapido-web', expiresIn: -1 });
    await expect(service.authenticate(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rechaza JWT sin caducidad', async () => {
    const token = await jwt.signAsync({ sub: id }, { issuer: 'distrirapido', audience: 'distrirapido-web' });
    await expect(service.authenticate(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
