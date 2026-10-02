import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService, PUBLIC_USER_SELECT } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
describe('US-003 usuarios', () => {
  const rol_id = randomUUID(); const usuario_id = randomUUID();
  const dto = { email: 'new@example.com', password: 'test-password-1234', rol_id };
  const publicUser = { usuario_id, email: dto.email, rol_id, estado: 'ACTIVO', creado_en: new Date(), rol: { rol_id, nombre: 'Administrador' } };
  const prisma = { usuario: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() }, rol: { findUnique: jest.fn() } };
  let service: UsersService;
  beforeEach(() => { jest.resetAllMocks(); service = new UsersService(prisma as unknown as PrismaService); prisma.rol.findUnique.mockResolvedValue(publicUser.rol); prisma.usuario.findUnique.mockResolvedValue(publicUser); prisma.usuario.findMany.mockResolvedValue([publicUser]); prisma.usuario.create.mockResolvedValue(publicUser); prisma.usuario.update.mockResolvedValue(publicUser); });
  it('lista y consulta sin seleccionar hash', async () => {
    expect(await service.list()).toEqual([publicUser]); expect(await service.get(usuario_id)).toEqual(publicUser);
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({ select: PUBLIC_USER_SELECT }));
    expect(PUBLIC_USER_SELECT).not.toHaveProperty('password_hash');
  });
  it('crea con Argon2id, estado predeterminado y proyección pública', async () => {
    expect(await service.create(dto)).toEqual(publicUser);
    const call = prisma.usuario.create.mock.calls[0][0];
    expect(call.data.estado).toBe('ACTIVO'); expect(call.select).toBe(PUBLIC_USER_SELECT);
    expect(call.data.password_hash.startsWith('$argon2id$')).toBe(true);
    expect(await argon2.verify(call.data.password_hash, dto.password)).toBe(true);
    expect(call.data).not.toHaveProperty('password');
    await service.create({ ...dto, estado: 'BLOQUEADO' });
    expect(prisma.usuario.create.mock.calls[1][0].data.estado).toBe('BLOQUEADO');
  });
  it.each([null, { nombre: 'Supervisor' }])('rechaza rol inexistente o fuera de línea base: %j', async (role) => {
    prisma.rol.findUnique.mockResolvedValue(role); await expect(service.create(dto)).rejects.toThrow('rol existente y permitido');
  });
  it('modifica solamente datos permitidos y admite edición sin rol', async () => {
    await service.update(usuario_id, { rol_id, estado: 'INACTIVO', email: 'changed@example.com' });
    expect(prisma.usuario.update).toHaveBeenCalledWith({ where: { usuario_id }, data: { rol_id, estado: 'INACTIVO', email: 'changed@example.com' }, select: PUBLIC_USER_SELECT });
    await service.update(usuario_id, { estado: 'ACTIVO' });
  });
  it('rechaza usuario ausente y actualización vacía', async () => {
    await expect(service.update(usuario_id, {})).rejects.toThrow('al menos un atributo');
    await expect(service.update(usuario_id, { email: undefined, rol_id: undefined, estado: undefined })).rejects.toThrow('al menos un atributo');
    prisma.usuario.findUnique.mockResolvedValue(null); await expect(service.get(usuario_id)).rejects.toThrow('no encontrado');
  });
  it.each([['P2002', 'Ya existe'], ['P2003', 'rol existente'], ['P2025', 'no encontrado']])('traduce error Prisma %s sin datos sensibles', async (code, message) => {
    const cause = new Prisma.PrismaClientKnownRequestError('internal', { code, clientVersion: 'test' });
    prisma.usuario.create.mockRejectedValue(cause); await expect(service.create(dto)).rejects.toThrow(message);
    prisma.usuario.update.mockRejectedValue(cause); await expect(service.update(usuario_id, { estado: 'ACTIVO' })).rejects.toThrow(message);
  });
  it.each([new Error('internal'), new Prisma.PrismaClientKnownRequestError('internal', { code: 'P0000', clientVersion: 'test' })])('propaga fallos inesperados al filtro sanitizado', async (cause) => {
    prisma.usuario.create.mockRejectedValue(cause); await expect(service.create(dto)).rejects.toBe(cause);
  });
  it('controller delega las cuatro operaciones', async () => {
    const controller = new UsersController(service);
    await controller.list(); await controller.get(usuario_id); await controller.create(dto); await controller.update(usuario_id, { estado: 'ACTIVO' });
  });
});
