import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_STATES, OPERATIONAL_ROUTE_STATES, OperationsQueryDto } from './dto/operations-query.dto';

// US-019 / RF-016: consulta de solo lectura del estado de rutas en ejecución y sus entregas.
// Las rutas GENERADA pertenecen a la planificación (US-013) y no forman parte de la operación.
// Se usa siempre la versión vigente (la de mayor número), igual que el panel del conductor.
const LIMA_OFFSET_MS = 5 * 3_600_000; // America/Lima: UTC−05:00 sin horario de verano.
const DAY_MS = 86_400_000;

// Inicio del día indicado en America/Lima. Rechaza fechas inexistentes como 2026-02-30.
function limaDay(value: string, field: string) {
  const [year, month, day] = value.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new BadRequestException(`${field}: la fecha no existe.`);
  }
  return new Date(utc + LIMA_OFFSET_MS);
}

const percentage = (processed: number, total: number) => total ? Math.round(processed * 10000 / total) / 100 : 0;

function deliveryCounters(stops: { estado_entrega: string }[]) {
  const counters = { total: stops.length, pending: 0, delivered: 0, not_delivered: 0 };
  for (const stop of stops) {
    if (stop.estado_entrega === 'ENTREGADA') counters.delivered++;
    else if (stop.estado_entrega === 'NO_ENTREGADA') counters.not_delivered++;
    else counters.pending++;
  }
  const processed = counters.delivered + counters.not_delivered;
  return { ...counters, processed, percentage: percentage(processed, counters.total) };
}

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: OperationsQueryDto) {
    const { page = 1, pageSize = 10 } = query;
    const from = query.desde ? limaDay(query.desde, 'desde') : undefined;
    const to = query.hasta ? new Date(+limaDay(query.hasta, 'hasta') + DAY_MS) : undefined;
    if (from && to && +to <= +from) throw new BadRequestException('El rango de fechas no es válido: «desde» es posterior a «hasta».');

    const where: Prisma.RutaWhereInput = {
      estado: query.estado ? query.estado : { in: [...OPERATIONAL_ROUTE_STATES] },
      ...(query.conductor_id ? { conductor_id: query.conductor_id } : {}),
      ...(from || to ? { asignado_en: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
      ...(query.search ? { OR: [
        { conductor: { nombre_completo: { contains: query.search, mode: 'insensitive' } } },
        { versiones: { some: { vehiculo: { placa: { contains: query.search, mode: 'insensitive' } } } } },
      ] } : {}),
    };

    if (query.estado_entrega || query.con_incidencias === 'true') {
      const ids = await this.routesMatchingDeliveries(query.estado_entrega, query.con_incidencias === 'true');
      where.ruta_id = { in: ids };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ruta.findMany({
        where,
        orderBy: [{ asignado_en: 'desc' }, { ruta_id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          ruta_id: true, estado: true, asignado_en: true, iniciado_en: true, finalizado_en: true, current_version: true,
          conductor: { select: { conductor_id: true, nombre_completo: true } },
          versiones: {
            orderBy: { numero: 'desc' }, take: 1,
            select: {
              numero: true, distancia_m: true, duracion_s: true,
              vehiculo: { select: { vehiculo_id: true, placa: true, tipo: true } },
              paradas: { select: { estado_entrega: true, _count: { select: { incidencias: true } } } },
            },
          },
        },
      }),
      this.prisma.ruta.count({ where }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });

    return {
      items: items.map(({ versiones, ...route }) => {
        const version = versiones[0];
        const stops = version?.paradas ?? [];
        return {
          ...route,
          version: version ? { numero: version.numero, distancia_m: version.distancia_m, duracion_s: version.duracion_s, vehiculo: version.vehiculo } : null,
          deliveries: deliveryCounters(stops),
          incidents: stops.reduce((sum, stop) => sum + stop._count.incidencias, 0),
        };
      }),
      total, page, pageSize,
    };
  }

  // Resumen general de la operación, independiente de filtros y paginación.
  async summary() {
    const [routes, deliveries, incidents] = await this.prisma.$transaction([
      this.prisma.ruta.groupBy({ by: ['estado'], where: { estado: { in: [...OPERATIONAL_ROUTE_STATES] } }, _count: { _all: true }, orderBy: { estado: 'asc' } }),
      this.prisma.$queryRaw<{ estado_entrega: string; total: bigint }[]>`
        WITH vigente AS (
          SELECT DISTINCT ON (rv.ruta_id) rv.ruta_version_id
          FROM rutas_versiones rv JOIN rutas r ON r.ruta_id = rv.ruta_id
          WHERE r.estado IN ('ASIGNADA', 'EN_CURSO', 'COMPLETADA')
          ORDER BY rv.ruta_id, rv.numero DESC
        )
        SELECT p.estado_entrega, COUNT(*)::bigint AS total
        FROM paradas_ruta p JOIN vigente v ON v.ruta_version_id = p.ruta_version_id
        GROUP BY p.estado_entrega`,
      this.prisma.$queryRaw<{ total: bigint }[]>`
        WITH vigente AS (
          SELECT DISTINCT ON (rv.ruta_id) rv.ruta_version_id
          FROM rutas_versiones rv JOIN rutas r ON r.ruta_id = rv.ruta_id
          WHERE r.estado IN ('ASIGNADA', 'EN_CURSO', 'COMPLETADA')
          ORDER BY rv.ruta_id, rv.numero DESC
        )
        SELECT COUNT(*)::bigint AS total
        FROM incidencias_entrega i
        JOIN paradas_ruta p ON p.parada_id = i.parada_id
        JOIN vigente v ON v.ruta_version_id = p.ruta_version_id`,
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });

    const routesByState = Object.fromEntries(OPERATIONAL_ROUTE_STATES.map(state => [state, 0])) as Record<typeof OPERATIONAL_ROUTE_STATES[number], number>;
    for (const row of routes) if (row.estado in routesByState) routesByState[row.estado as keyof typeof routesByState] = typeof row._count === 'object' ? row._count._all ?? 0 : 0;
    const deliveriesByState = Object.fromEntries(DELIVERY_STATES.map(state => [state, 0])) as Record<typeof DELIVERY_STATES[number], number>;
    for (const row of deliveries) if (row.estado_entrega in deliveriesByState) deliveriesByState[row.estado_entrega as keyof typeof deliveriesByState] = Number(row.total);
    return { routes: routesByState, deliveries: deliveriesByState, incidents: Number(incidents[0]?.total ?? 0) };
  }

  async detail(id: string) {
    const route = await this.prisma.ruta.findFirst({
      where: { ruta_id: id, estado: { in: [...OPERATIONAL_ROUTE_STATES] } },
      select: {
        ruta_id: true, estado: true, asignado_en: true, iniciado_en: true, finalizado_en: true, current_version: true,
        conductor: { select: { conductor_id: true, nombre_completo: true, telefono: true } },
        versiones: {
          orderBy: { numero: 'desc' }, take: 1,
          select: {
            numero: true, distancia_m: true, duracion_s: true,
            vehiculo: { select: { vehiculo_id: true, placa: true, tipo: true } },
            paradas: {
              orderBy: { secuencia: 'asc' },
              select: {
                parada_id: true, pedido_id: true, secuencia: true, datos: true, estado_entrega: true, causa_no_entrega: true, atendido_en: true,
                pedido: { select: { estado: true } },
                incidencias: { orderBy: [{ registrado_en: 'asc' }, { incidencia_id: 'asc' }], select: { incidencia_id: true, tipo: true, descripcion: true, detalle_complementario: true, registrado_en: true } },
              },
            },
          },
        },
      },
    });
    if (!route || !route.versiones.length) throw new NotFoundException('La ruta no existe o todavía no está en operación.');
    const { versiones, ...rest } = route;
    const version = versiones[0];
    const stops = version.paradas.map(({ datos, pedido, ...stop }) => ({
      ...stop,
      direccion: typeof (datos as { direccion?: unknown })?.direccion === 'string' ? (datos as { direccion: string }).direccion : null,
      pedido_estado: pedido.estado,
    }));
    return {
      ...rest,
      version: { numero: version.numero, distancia_m: version.distancia_m, duracion_s: version.duracion_s, vehiculo: version.vehiculo },
      deliveries: deliveryCounters(stops),
      incidents: stops.reduce((sum, stop) => sum + stop.incidencias.length, 0),
      stops,
    };
  }

  private async routesMatchingDeliveries(state: string | undefined, withIncidents: boolean) {
    const rows = await this.prisma.$queryRaw<{ ruta_id: string }[]>`
      WITH vigente AS (
        SELECT DISTINCT ON (rv.ruta_id) rv.ruta_id, rv.ruta_version_id
        FROM rutas_versiones rv
        ORDER BY rv.ruta_id, rv.numero DESC
      )
      SELECT v.ruta_id
      FROM vigente v
      WHERE (${state ?? null}::text IS NULL OR EXISTS (
              SELECT 1 FROM paradas_ruta p
              WHERE p.ruta_version_id = v.ruta_version_id AND p.estado_entrega = ${state ?? null}::text))
        AND (${withIncidents} = false OR EXISTS (
              SELECT 1 FROM paradas_ruta p JOIN incidencias_entrega i ON i.parada_id = p.parada_id
              WHERE p.ruta_version_id = v.ruta_version_id))`;
    return rows.map(row => row.ruta_id);
  }
}
