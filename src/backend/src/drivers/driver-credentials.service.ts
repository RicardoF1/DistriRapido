import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../roles/roles';
import { ChangeDriverPasswordDto, NewDriverPasswordDto, ResetDriverPasswordDto } from './dto/driver-credentials.dto';

const selection = { conductor_id: true, usuario_id: true, estado: true, usuario: { include: { rol: true } } } as const;
@Injectable()
export class DriverCredentialsService {
  constructor(private readonly prisma: PrismaService, private readonly passwords: PasswordService) {}
  private policy(dto: NewDriverPasswordDto) {
    if (typeof dto.password !== 'string' || [...dto.password].length < 12 || [...dto.password].length > 128 || !dto.password.trim() || dto.password !== dto.password_confirmation) throw new BadRequestException('Usa una contraseña de 12 a 128 caracteres y confirma exactamente el mismo valor. Se admiten frases de contraseña.');
  }
  private async driver(db: Prisma.TransactionClient, id: string, own = false) {
    const row = await db.conductor.findUnique({ where: own ? { usuario_id: id } : { conductor_id: id }, select: selection });
    if (!row || !row.usuario) throw new NotFoundException('Conductor o cuenta vinculada no encontrados.');
    if (row.usuario.rol.nombre !== ROLE_NAMES.driver) throw new BadRequestException('La cuenta vinculada debe conservar el rol Conductor.');
    if (own && (row.estado !== 'ACTIVO' || row.usuario.estado !== 'ACTIVO')) throw new ForbiddenException('La cuenta y ficha de conductor deben estar activas.');
    return row as typeof row & { usuario: NonNullable<typeof row.usuario> };
  }
  async metadata(id: string) {
    const row = await this.driver(this.prisma, id);
    return { usuario_id: row.usuario.usuario_id, email: row.usuario.email, estado: row.usuario.estado, credentials_version: row.usuario.credentials_version };
  }
  async reset(id: string, dto: ResetDriverPasswordDto) {
    this.policy(dto);
    if (dto.confirmed !== true) throw new BadRequestException('Confirma expresamente el restablecimiento y cierre de sesiones.');
    const row = await this.driver(this.prisma, id);
    if (row.usuario_id !== dto.expected_usuario_id || row.usuario.credentials_version !== dto.expected_credentials_version) throw new ConflictException('La cuenta o sus credenciales cambiaron. Recarga antes de confirmar.');
    await this.change(row, dto);
    return { message: 'Contraseña restablecida. Las sesiones anteriores quedaron invalidadas.' };
  }
  async own(usuario_id: string, dto: ChangeDriverPasswordDto) {
    this.policy(dto);
    const row = await this.driver(this.prisma, usuario_id, true);
    if (!await this.passwords.verify(row.usuario.password_hash, dto.current_password)) throw new BadRequestException('La contraseña actual no es correcta.');
    await this.change(row, dto, true);
    return { message: 'Contraseña actualizada. Inicia sesión de nuevo con tu nueva contraseña.' };
  }
  private async change(row: Awaited<ReturnType<DriverCredentialsService['driver']>>, dto: NewDriverPasswordDto, own = false) {
    if (await this.passwords.verify(row.usuario.password_hash, dto.password)) throw new BadRequestException('La contraseña nueva debe ser distinta de la actual.');
    const hash = await this.passwords.hash(dto.password);
    try {
      await this.prisma.$transaction(async tx => {
        const current = await this.driver(tx, row.conductor_id);
        if (current.usuario_id !== row.usuario_id || current.usuario.credentials_version !== row.usuario.credentials_version || current.usuario.password_hash !== row.usuario.password_hash || own && (current.estado !== 'ACTIVO' || current.usuario.estado !== 'ACTIVO')) throw new ConflictException('La cuenta o sus credenciales cambiaron. Recarga antes de reintentar.');
        if (current.usuario.credentials_version >= 2147483647) throw new ServiceUnavailableException('No se puede actualizar la versión de credenciales. Contacta al responsable del sistema.');
        const result = await tx.usuario.updateMany({ where: { usuario_id: row.usuario.usuario_id, credentials_version: row.usuario.credentials_version, password_hash: row.usuario.password_hash, rol: { nombre: ROLE_NAMES.driver }, conductor: { is: { conductor_id: row.conductor_id } } }, data: { password_hash: hash, credentials_version: { increment: 1 } } });
        if (result.count !== 1) throw new ConflictException('La cuenta o sus credenciales cambiaron. Recarga antes de reintentar.');
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 5000, maxWait: 2000 });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2028'].includes(cause.code)) throw new ConflictException('Otra operación cambió la cuenta. Recarga antes de reintentar.');
      throw cause;
    }
  }
}
