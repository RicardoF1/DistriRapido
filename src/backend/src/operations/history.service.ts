import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_PAGE_SIZE } from '../common/pagination';
import { HistoryQueryDto } from './dto/history-query.dto';
import { DAY_MS, limaDay, routesMatchingDeliveries } from './operations.service';

// US-023 / RF-021: historial de operaciones terminadas (rutas COMPLETADA), de solo lectura.
// El listado se ordena por fecha de finalización; el detalle reúne la trazabilidad completa:
// planificación, confirmación (US-020), asignación, ejecución, entregas e incidencias (US-018)
// y sostenibilidad (US-021). Se usa siempre la versión vigente, como en US-019.
export const HISTORY_STATE = 'COMPLETADA';

const deliveryCounts = (stops: { estado_entrega: string }[]) => ({
  total: stops.length,
  realizadas: stops.filter(stop => stop.estado_entrega === 'ENTREGADA').length,
  no_realizadas: stops.filter(stop => stop.estado_entrega === 'NO_ENTREGADA').length,
});
const direccion = (datos: Prisma.JsonValue) => {
  const value = (datos as { direccion?: unknown } | null)?.direccion;
  return typeof value === 'string' ? value : null;
};
const planning = { alternativa: { select: { ejecucion: { select: { version: { select: { numero: true, planificacion: { select: { planificacion_id: true, etiqueta: true } } } } } } } } } satisfies Prisma.RutaSelect;

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: HistoryQueryDto) {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = query;
    const from = query.desde ? limaDay(query.desde, 'desde') : undefined;
    const to = query.hasta ? new Date(+limaDay(query.hasta, 'hasta') + DAY_MS) : undefined;
    if (from && to && +to <= +from) throw new BadRequestException('El rango de fechas no es válido: «desde» es posterior a «hasta».');

    const where: Prisma.RutaWhereInput = {
      estado: HISTORY_STATE,
      ...(from || to ? { finalizado_en: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
      ...(query.search ? { OR: [
        { conductor: { nombre_completo: { contains: query.search, mode: 'insensitive' } } },
        { versiones: { some: { vehiculo: { placa: { contains: query.search, mode: 'insensitive' } } } } },
      ] } : {}),
    };
    const failed = query.con_no_entregas === 'true'; const incidents = query.con_incidencias === 'true';
    if (failed || incidents) where.ruta_id = { in: await routesMatchingDeliveries(this.prisma, failed ? 'NO_ENTREGADA' : undefined, incidents) };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ruta.findMany({
        where,
        orderBy: [{ finalizado_en: 'desc' }, { ruta_id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          ruta_id: true, iniciado_en: true, finalizado_en: true,
          ...planning,
          conductor: { select: { conductor_id: true, nombre_completo: true } },
          sostenibilidad: { select: { registro_id: true } },
          versiones: {
            orderBy: { numero: 'desc' }, take: 1,
            select: { numero: true, vehiculo: { select: { vehiculo_id: true, placa: true } }, paradas: { select: { estado_entrega: true, _count: { select: { incidencias: true } } } } },
          },
        },
      }),
      this.prisma.ruta.count({ where }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });

    return {
      items: items.map(({ versiones, alternativa, sostenibilidad, ...route }) => {
        const version = versiones[0];
        const stops = version?.paradas ?? [];
        return {
          ...route,
          planificacion: alternativa.ejecucion.version.planificacion,
          vehiculo: version?.vehiculo ?? null,
          entregas: deliveryCounts(stops),
          incidencias: stops.reduce((sum, stop) => sum + stop._count.incidencias, 0),
          con_sostenibilidad: sostenibilidad !== null,
        };
      }),
      total, page, pageSize,
    };
  }

  async detail(id: string) {
    const route = await this.prisma.ruta.findFirst({
      where: { ruta_id: id, estado: HISTORY_STATE },
      select: {
        ruta_id: true, estado: true, creado_en: true, confirmado_en: true, version_confirmada: true, asignado_en: true, iniciado_en: true, finalizado_en: true, current_version: true,
        ...planning,
        confirmador: { select: { email: true } },
        conductor: { select: { conductor_id: true, nombre_completo: true } },
        sostenibilidad: {
          select: {
            ruta_version: true, distancia_km: true, combustible_l: true, factor_emision_kg_co2_km: true, emisiones_co2_kg: true, origen_datos: true,
            costo_combustible: true, observaciones: true, registrado_en: true, registrador: { select: { email: true } },
          },
        },
        versiones: {
          orderBy: { numero: 'desc' }, take: 1,
          select: {
            numero: true, distancia_m: true, duracion_s: true,
            vehiculo: { select: { vehiculo_id: true, placa: true, tipo: true } },
            paradas: {
              orderBy: { secuencia: 'asc' },
              select: {
                parada_id: true, pedido_id: true, secuencia: true, datos: true, estado_entrega: true, causa_no_entrega: true, atendido_en: true,
                incidencias: { orderBy: [{ registrado_en: 'asc' }, { incidencia_id: 'asc' }], select: { incidencia_id: true, tipo: true, descripcion: true, detalle_complementario: true, registrado_en: true } },
              },
            },
          },
        },
      },
    });
    if (!route || !route.versiones.length) throw new NotFoundException('La operación no existe o todavía no ha terminado.');
    const { versiones, alternativa, confirmador, ...rest } = route;
    const version = versiones[0];
    const stops = version.paradas.map(({ datos, ...stop }) => ({ ...stop, direccion: direccion(datos) }));
    return {
      ...rest,
      planificacion: { ...alternativa.ejecucion.version.planificacion, version: alternativa.ejecucion.version.numero },
      confirmado_por: confirmador?.email ?? null,
      version: { numero: version.numero, distancia_m: version.distancia_m, duracion_s: version.duracion_s, vehiculo: version.vehiculo },
      entregas: deliveryCounts(stops),
      incidencias: stops.reduce((sum, stop) => sum + stop.incidencias.length, 0),
      paradas: stops,
    };
  }
}
