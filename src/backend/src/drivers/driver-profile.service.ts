import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../roles/roles';
import type { SessionIdentityDto } from '../auth/dto/auth-response.dto';
import { Prisma } from '@prisma/client';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { CreateDeliveryIncidentDto } from './dto/create-delivery-incident.dto';

const INCIDENT_SELECT = { incidencia_id: true, tipo: true, descripcion: true, detalle_complementario: true, registrado_en: true } as const;

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
                incidencias: { orderBy: [{ registrado_en: 'asc' }, { incidencia_id: 'asc' }], select: INCIDENT_SELECT },
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
  }
  async updateDelivery(user: SessionIdentityDto, deliveryId: string, dto: UpdateDeliveryStatusDto) {
    const driver = await this.activeDriver(user);
    const cause = dto.causa?.trim() || null;
    if (dto.estado === 'NO_ENTREGADA' && !cause) {
      throw new BadRequestException('La causa es obligatoria cuando la entrega no se completa.');
    }
    if (dto.estado === 'ENTREGADA' && cause) {
      throw new BadRequestException('Una entrega completada no admite causa de no entrega.');
    }

    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT parada_id FROM paradas_ruta WHERE parada_id=${deliveryId}::uuid FOR UPDATE`;
      const stop = await tx.paradaRuta.findUnique({
        where: { parada_id: deliveryId },
        include: {
          pedido: { select: { pedido_id: true, estado: true } },
          ruta_version: {
            select: {
              numero: true,
              ruta: {
                select: {
                  ruta_id: true,
                  conductor_id: true,
                  estado: true,
                  current_version: true,
                  asignado_en: true,
                  iniciado_en: true,
                },
              },
            },
          },
        },
      });
      if (!stop || stop.ruta_version.ruta.conductor_id !== driver.conductor_id) {
        throw new ForbiddenException('La entrega no existe o no esta asignada a tu cuenta.');
      }
      const route = stop.ruta_version.ruta;
      if (stop.ruta_version.numero !== route.current_version) {
        throw new ConflictException('La entrega pertenece a una version anterior de la ruta.');
      }
      if (!['ASIGNADA', 'EN_CURSO'].includes(route.estado)) {
        throw new ConflictException('La ruta no admite actualizaciones de entrega en su estado actual.');
      }
      if (stop.estado_entrega !== 'PENDIENTE') {
        throw new ConflictException('La entrega ya tiene un resultado final y no puede modificarse.');
      }
      if (stop.version_entrega !== dto.expected_version) {
        throw new ConflictException('La entrega cambio. Recarga la ruta antes de reintentar.');
      }

      const now = new Date();
      const changed = await tx.paradaRuta.updateMany({
        where: {
          parada_id: deliveryId,
          estado_entrega: 'PENDIENTE',
          version_entrega: dto.expected_version,
        },
        data: {
          estado_entrega: dto.estado,
          causa_no_entrega: dto.estado === 'NO_ENTREGADA' ? cause : null,
          atendido_en: now,
          version_entrega: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new ConflictException('La entrega cambio. Recarga la ruta antes de reintentar.');
      }

      if (dto.estado === 'ENTREGADA' && stop.pedido.estado !== 'ENTREGADO') {
        if (stop.pedido.estado !== 'EN_RUTA') {
          throw new ConflictException('El pedido debe estar EN_RUTA antes de registrarse como entregado.');
        }
        await tx.pedido.update({
          where: { pedido_id: stop.pedido.pedido_id },
          data: { estado: 'ENTREGADO' },
        });
      }

      const totals = await tx.paradaRuta.groupBy({
        by: ['estado_entrega'],
        where: {
          ruta_version: {
            ruta_id: route.ruta_id,
            numero: route.current_version,
          },
        },
        _count: { _all: true },
      });
      const counters = { PENDIENTE: 0, ENTREGADA: 0, NO_ENTREGADA: 0 };
      for (const item of totals) {
        if (item.estado_entrega in counters) counters[item.estado_entrega as keyof typeof counters] = item._count._all;
      }
      const total = counters.PENDIENTE + counters.ENTREGADA + counters.NO_ENTREGADA;
      const processed = counters.ENTREGADA + counters.NO_ENTREGADA;
      const completed = total > 0 && processed === total;
      await tx.ruta.update({
        where: { ruta_id: route.ruta_id },
        data: completed
          ? { estado: 'COMPLETADA', iniciado_en: route.iniciado_en ?? now, finalizado_en: now }
          : { estado: 'EN_CURSO', iniciado_en: route.iniciado_en ?? now },
      });
      const updated = await tx.paradaRuta.findUniqueOrThrow({
        where: { parada_id: deliveryId },
        select: {
          parada_id: true,
          pedido_id: true,
          estado_entrega: true,
          causa_no_entrega: true,
          atendido_en: true,
          actualizado_en: true,
          version_entrega: true,
        },
      });
      return {
        delivery: updated,
        route: {
          ruta_id: route.ruta_id,
          estado: completed ? 'COMPLETADA' : 'EN_CURSO',
        },
        progress: {
          total,
          processed,
          delivered: counters.ENTREGADA,
          not_delivered: counters.NO_ENTREGADA,
          percentage: total ? Math.round(processed * 10000 / total) / 100 : 0,
        },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 3000 });
  }

  // US-018 / RF-015: registra una incidencia sobre una entrega propia sin alterar su estado.
  async createIncident(user: SessionIdentityDto, deliveryId: string, dto: CreateDeliveryIncidentDto) {
    const driver = await this.activeDriver(user);
    const description = dto.descripcion?.trim();
    if (!description) throw new BadRequestException(['descripcion: describe la incidencia.']);
    const detail = dto.detalle_complementario?.trim() || null;

    return this.prisma.$transaction(async tx => {
      const stop = await tx.paradaRuta.findUnique({
        where: { parada_id: deliveryId },
        select: {
          parada_id: true,
          ruta_version: { select: { numero: true, ruta: { select: { conductor_id: true, estado: true, current_version: true } } } },
        },
      });
      if (!stop || stop.ruta_version.ruta.conductor_id !== driver.conductor_id) {
        throw new ForbiddenException('La entrega no existe o no esta asignada a tu cuenta.');
      }
      const route = stop.ruta_version.ruta;
      if (stop.ruta_version.numero !== route.current_version) {
        throw new ConflictException('La entrega pertenece a una version anterior de la ruta.');
      }
      if (!['ASIGNADA', 'EN_CURSO'].includes(route.estado)) {
        throw new ConflictException('La ruta no admite registrar incidencias en su estado actual.');
      }
      const incident = await tx.incidenciaEntrega.create({
        data: { parada_id: stop.parada_id, conductor_id: driver.conductor_id, tipo: dto.tipo, descripcion: description, detalle_complementario: detail },
        select: INCIDENT_SELECT,
      });
      return { parada_id: stop.parada_id, incidencia: incident };
    }, { timeout: 15000, maxWait: 3000 });
  }
}
