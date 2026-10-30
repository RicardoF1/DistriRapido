import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../roles/roles';
import type { SessionIdentityDto } from '../auth/dto/auth-response.dto';

@Injectable()
export class DriverProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async own(user: SessionIdentityDto) {
    if (user.rol.nombre !== ROLE_NAMES.driver) {
      throw new ForbiddenException('Este acceso requiere el rol Usuario Final / Conductor.');
    }
    const driver = await this.prisma.conductor.findUnique({
      where: { usuario_id: user.usuario_id },
      select: { conductor_id: true, nombre_completo: true, estado: true, usuario: { select: { estado: true, rol: { select: { nombre: true } } } } },
    });
    if (!driver) throw new ForbiddenException('Tu cuenta no tiene un conductor vinculado. Contacta al administrador.');
    if (driver.estado !== 'ACTIVO') throw new ForbiddenException('Tu ficha de conductor está inactiva. Contacta al administrador.');
    if (driver.usuario?.estado !== 'ACTIVO') throw new UnauthorizedException('Debes iniciar sesión para acceder.');
    if (driver.usuario.rol.nombre !== ROLE_NAMES.driver) throw new ForbiddenException('Este acceso requiere el rol Usuario Final / Conductor.');
    return { conductor_id: driver.conductor_id, nombre_completo: driver.nombre_completo, estado: driver.estado };
  }
}
