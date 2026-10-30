import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DriverCredentialsService } from './driver-credentials.service';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { ROLE_NAMES } from '../roles/roles';

describe('Credenciales de conductores', () => {
  const id = randomUUID(); const uid = randomUUID();
  const account = { usuario_id: uid, email: 'fixture@example.test', estado: 'ACTIVO', credentials_version: 0, password_hash: 'old', rol: { nombre: ROLE_NAMES.driver } };
  const dto = { password: 'Una frase de prueba', password_confirmation: 'Una frase de prueba', expected_usuario_id: uid, expected_credentials_version: 0, confirmed: true as const };
  const tx = { conductor: { findUnique: jest.fn() }, usuario: { updateMany: jest.fn() } };
  const prisma = { conductor: tx.conductor, $transaction: jest.fn() };
  const passwords = { verify: jest.fn(), hash: jest.fn() };
  let service: DriverCredentialsService;
  beforeEach(() => {
    jest.resetAllMocks(); tx.conductor.findUnique.mockResolvedValue({ conductor_id: id, usuario_id: uid, estado: 'ACTIVO', usuario: account });
    prisma.$transaction.mockImplementation((operation: (db: typeof tx) => unknown) => operation(tx));
    tx.usuario.updateMany.mockResolvedValue({ count: 1 }); passwords.verify.mockResolvedValue(false); passwords.hash.mockResolvedValue('new-hash');
    service = new DriverCredentialsService(prisma as unknown as PrismaService, passwords as unknown as PasswordService);
  });
  it('actualiza hash y versión juntos sin devolver secretos ni cambiar vínculo', async () => {
    expect(await service.reset(id, dto)).toEqual({ message: 'Contraseña restablecida. Las sesiones anteriores quedaron invalidadas.' });
    expect(tx.usuario.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { password_hash: 'new-hash', credentials_version: { increment: 1 } }, where: expect.objectContaining({ usuario_id: uid, credentials_version: 0, password_hash: 'old' }) }));
  });
  it.each(['corta', ' '.repeat(12), 'x'.repeat(129)])('rechaza política inválida sin escritura', async password => {
    await expect(service.reset(id, { ...dto, password, password_confirmation: password })).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.usuario.updateMany).not.toHaveBeenCalled();
  });
  it('rechaza confirmación distinta y falta de aprobación', async () => {
    await expect(service.reset(id, { ...dto, password_confirmation: 'otra' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.reset(id, { ...dto, confirmed: false })).rejects.toBeInstanceOf(BadRequestException);
  });
  it('no admite usuario manipulado, versión obsoleta ni rol incompatible', async () => {
    await expect(service.reset(id, { ...dto, expected_usuario_id: randomUUID() })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.reset(id, { ...dto, expected_credentials_version: 1 })).rejects.toBeInstanceOf(ConflictException);
    tx.conductor.findUnique.mockResolvedValue({ usuario_id: uid, usuario: { ...account, rol: { nombre: ROLE_NAMES.administrator } } });
    await expect(service.reset(id, dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.usuario.updateMany).not.toHaveBeenCalled();
  });
  it('rechaza contraseña repetida y una actualización concurrente', async () => {
    passwords.verify.mockResolvedValueOnce(true);
    await expect(service.reset(id, dto)).rejects.toBeInstanceOf(BadRequestException);
    tx.usuario.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.reset(id, dto)).rejects.toBeInstanceOf(ConflictException);
  });
});
