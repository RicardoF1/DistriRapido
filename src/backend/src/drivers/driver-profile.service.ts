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

  private async activeDriver(user: SessionIdentityDto) {
    if (user.rol.nombre !== ROLE_NAMES.driver) throw new ForbiddenException('Este acceso requiere el rol Usuario Final / Conductor.');
    const driver = await this.prisma.conductor.findUnique({
      where: { usuario_id: user.usuario_id },
      select: { conductor_id: true, nombre_completo: true, estado: true, usuario: { select: { estado: true, rol: { select: { nombre: true } } } } },
    });
    if (!driver) throw new ForbiddenException('Tu cuenta no tiene un conductor vinculado. Contacta al administrador.');
    if (driver.estado !== 'ACTIVO') throw new ForbiddenException('Tu ficha de conductor esta inactiva. Contacta al administrador.');
    if (driver.usuario?.estado !== 'ACTIVO') throw new UnauthorizedException('Debes iniciar sesion para acceder.');
    if (driver.usuario.rol.nombre !== ROLE_NAMES.driver) throw new ForbiddenException('Este acceso requiere el rol Usuario Final / Conductor.');
    return driver;
  }

  async routes(user: SessionIdentityDto) {
    const driver = await this.activeDriver(user);
    const items = await this.prisma.ruta.findMany({
      where: { conductor_id: driver.conductor_id, estado: { in: ['ASIGNADA', 'EN_CURSO'] } },
      orderBy: [{ asignado_en: 'desc' }, { ruta_id: 'asc' }],
      select: {
        ruta_id: true, estado: true, asignado_en: true, iniciado_en: true, current_version: true,
        versiones: {
          orderBy: { numero: 'desc' }, take: 1,
          select: {
            ruta_version_id: true, numero: true, distancia_m: true, duracion_s: true, resultado: true,
            vehiculo: { select: { vehiculo_id: true, placa: true, tipo: true } },
            paradas: { select: { parada_id: true, estado_entrega: true }, orderBy: { secuencia: 'asc' } },
          },
        },
      },
    });
    return items.map(route => {
      const version = route.versiones[0];
      const total = version?.paradas.length ?? 0;
      const processed = version?.paradas.filter(stop => stop.estado_entrega !== 'PENDIENTE').length ?? 0;
      return {
        ruta_id: route.ruta_id, estado: route.estado, asignado_en: route.asignado_en, iniciado_en: route.iniciado_en,
        current_version: route.current_version,
        version: version ? { ruta_version_id: version.ruta_version_id, numero: version.numero, distancia_m: version.distancia_m, duracion_s: version.duracion_s, resultado: version.resultado, vehiculo: version.vehiculo } : null,
        progress: { total, processed, percentage: total ? Math.round(processed * 10000 / total) / 100 : 0 },
      };
    });
  }

  async route(user: SessionIdentityDto, id: string) {
    const driver = await this.activeDriver(user);
    const route = await this.prisma.ruta.findFirst({
      where: { ruta_id: id, conductor_id: driver.conductor_id, estado: { in: ['ASIGNADA', 'EN_CURSO', 'COMPLETADA'] } },
      select: {
        ruta_id: true, estado: true, asignado_en: true, iniciado_en: true, finalizado_en: true, current_version: true,
        versiones: {
          orderBy: { numero: 'desc' }, take: 1,
          select: {
            ruta_version_id: true, numero: true, distancia_m: true, duracion_s: true, resultado: true,
            vehiculo: { select: { vehiculo_id: true, placa: true, tipo: true } },
            paradas: {
              orderBy: { secuencia: 'asc' },
              select: {
                parada_id: true, pedido_id: true, secuencia: true, datos: true, estado_entrega: true,
                causa_no_entrega: true, atendido_en: true, actualizado_en: true, version_entrega: true,
              },
            },
          },
        },
      },
    });
    if (!route || !route.versiones.length) throw new ForbiddenException('La ruta no existe o no esta asignada a tu cuenta.');
    const version = route.versiones[0];
    const total = version.paradas.length;
    const processed = version.paradas.filter(stop => stop.estado_entrega !== 'PENDIENTE').length;
    return {
      ruta_id: route.ruta_id, estado: route.estado, asignado_en: route.asignado_en, iniciado_en: route.iniciado_en,
      finalizado_en: route.finalizado_en, current_version: route.current_version,
      version,
      progress: { total, processed, percentage: total ? Math.round(processed * 10000 / total) / 100 : 0 },
    };
  }}
