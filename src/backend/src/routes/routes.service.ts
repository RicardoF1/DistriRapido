import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { routingDatabaseError, sourceInput, sources } from '../planning/planning-data';
import { makeHash, type PreparedSnapshot } from '../planning/planning-domain';
import { RouteQueryDto } from './dto/route-query.dto';
import { ASSIGNABLE_ROUTE_STATE, AssignRouteDto } from './dto/assign-route.dto';
import { CONFIRMABLE_ROUTE_STATE, ConfirmRouteDto } from './dto/confirm-route.dto';
import { DEFAULT_PAGE_SIZE } from '../common/pagination';

const DRIVER_ROLE = 'Usuario Final / Conductor';
/** Una ruta CONFIRMADA ya reserva su vehículo y sus pedidos aunque aún no tenga conductor (US-020). */
const ACTIVE_ROUTE_STATES = ['CONFIRMADA', 'ASIGNADA', 'EN_CURSO'];
const ASSIGNMENT_ROUTE = {
  alternativa: { select: { ejecucion: { select: { version: { select: { snapshot: true } } } } } },
  versiones: { orderBy: { numero: 'desc' }, take: 1, select: { vehiculo_id: true, resultado: true, paradas: { select: { pedido_id: true } } } },
} satisfies Prisma.RutaSelect;
type AssignmentRoute = Prisma.RutaGetPayload<{ select: typeof ASSIGNMENT_ROUTE & { estado: true; conductor_id: true; current_version: true; version_confirmada: true } }>;
/** Datos actuales del pedido que se comparan con la copia guardada en cada parada. */
const STOP_ORDER_STATE = { pedido: { select: { estado: true, peso_kg: true, volumen_m3: true, ventana_inicio: true, ventana_fin: true, cliente: { select: { estado: true, direccion: true, latitud: true, longitud: true } } } } } satisfies Prisma.ParadaRutaInclude;
type StopWithOrder = Prisma.ParadaRutaGetPayload<{ include: typeof STOP_ORDER_STATE }>;
const CONFIRMATION_RESULT = { ruta_id: true, estado: true, current_version: true, confirmado_en: true, version_confirmada: true, confirmador: { select: { email: true } } } satisfies Prisma.RutaSelect;
type DriverState = { estado: string; usuario: { estado: string; rol: { nombre: string } } | null; disponibilidades: unknown[] };
export interface AssignmentCandidate { conductor_id: string; nombre_completo: string }

/** Versión actual confirmable y con jornada calculada: condición común de confirmación y asignación. */
function calculatedVersion<V extends { resultado: Prisma.JsonValue }>(route: { versiones: V[] }) {
  const version = route.versiones[0];
  if (!version) return { version };
  const result = version.resultado as { confirmable?: boolean; inicio?: string; end?: string };
  return { version, confirmable: result.confirmable === true, start: result.inicio ? new Date(result.inicio) : undefined, end: result.end ? new Date(result.end) : undefined };
}

/** Ruta CONFIRMADA, sin conductor, con la versión confirmada vigente y jornada calculada. */
function assignableRoute(route: AssignmentRoute) {
  if (route.estado === CONFIRMABLE_ROUTE_STATE && route.conductor_id === null) {
    throw new ConflictException('Confirma la ruta antes de asignarle un conductor.');
  }
  if (route.estado !== ASSIGNABLE_ROUTE_STATE || route.conductor_id !== null) {
    throw new ConflictException('La ruta ya fue asignada o cambió de estado. Recarga antes de reintentar.');
  }
  const { version, confirmable, start, end } = calculatedVersion(route);
  if (!version) throw new ConflictException('La ruta no tiene una versión disponible para asignar.');
  if (route.version_confirmada !== route.current_version) {
    throw new ConflictException('La versión confirmada no coincide con la versión actual. Confirma de nuevo la ruta.');
  }
  if (!confirmable || !start || !end) {
    throw new ConflictException('Solo se puede asignar una ruta confirmable con jornada calculada.');
  }
  const snapshot = route.alternativa.ejecucion.version.snapshot as unknown as PreparedSnapshot;
  return { version, snapshot, start, end };
}

/** Pedidos que cambiaron desde el cálculo: estado, cliente, dirección, coordenadas, carga o ventana. */
function stopWarnings(stops: StopWithOrder[]) {
  return stops.flatMap(p => {
    const old = p.datos as { direccion?: string; latitud?: number; longitud?: number; peso_kg?: number; volumen_m3?: number | null; ventana_inicio?: string; ventana_fin?: string };
    const changed = p.pedido.estado !== 'PENDIENTE' || p.pedido.cliente.estado !== undefined && p.pedido.cliente.estado !== 'ACTIVO' || p.pedido.cliente.direccion !== old.direccion || Number(p.pedido.cliente.latitud) !== old.latitud || Number(p.pedido.cliente.longitud) !== old.longitud || old.peso_kg !== undefined && Number(p.pedido.peso_kg) !== old.peso_kg || old.volumen_m3 !== undefined && (p.pedido.volumen_m3 === null ? null : Number(p.pedido.volumen_m3)) !== old.volumen_m3 || old.ventana_inicio !== undefined && +p.pedido.ventana_inicio !== Date.parse(old.ventana_inicio) || old.ventana_fin !== undefined && +p.pedido.ventana_fin !== Date.parse(old.ventana_fin);
    return changed ? [`PEDIDO_DESACTUALIZADO:${p.pedido_id}`] : [];
  });
}

/** Fuentes del cálculo (pedidos, vehículo y conductores) comparadas con la huella guardada. */
async function sourceWarnings(db: Prisma.TransactionClient, snapshot: PreparedSnapshot) {
  try { return makeHash(await sources(db, sourceInput(snapshot))) === snapshot.source_hash ? [] : ['FUENTES_DESACTUALIZADAS']; }
  catch (cause) { if (cause instanceof ConflictException) return ['RECURSOS_O_PEDIDOS_NO_DISPONIBLES']; throw cause; }
}

/** Traduce las advertencias vigentes a condiciones pendientes que el planificador puede resolver. */
export function pendingConditions(warnings: string[]) {
  const outdated = warnings.filter(code => code.startsWith('PEDIDO_DESACTUALIZADO:')).length;
  return [
    ...(outdated ? [`${outdated === 1 ? 'Un pedido cambió' : `${outdated} pedidos cambiaron`} desde el cálculo (estado, cliente, dirección, carga o ventana horaria).`] : []),
    ...(warnings.includes('FUENTES_DESACTUALIZADAS') ? ['Los datos usados en el cálculo cambiaron; genera una nueva planificación.'] : []),
    ...(warnings.includes('RECURSOS_O_PEDIDOS_NO_DISPONIBLES') ? ['El vehículo, los conductores o los pedidos del cálculo ya no están disponibles.'] : []),
  ];
}

/** Vehículo DISPONIBLE y ni vehículo ni pedidos comprometidos en la versión actual de otra ruta activa. */
async function assertRouteResources(db: Prisma.TransactionClient, routeId: string, version: AssignmentRoute['versiones'][number]) {
  const vehicle = await db.vehiculo.findUnique({ where: { vehiculo_id: version.vehiculo_id }, select: { estado: true } });
  if (vehicle?.estado !== 'DISPONIBLE') throw new ConflictException('El vehículo de la ruta no está disponible.');
  const activeOther = { ruta_id: { not: routeId }, estado: { in: ACTIVE_ROUTE_STATES } };
  const current = (v: { numero: number; ruta: { current_version: number } }) => v.numero === v.ruta.current_version;
  const vehicleRoutes = await db.rutaVersion.findMany({ where: { vehiculo_id: version.vehiculo_id, ruta: activeOther }, select: { numero: true, ruta: { select: { current_version: true } } } });
  if (vehicleRoutes.some(current)) throw new ConflictException('El vehículo ya está asignado a otra ruta activa.');
  const orders = version.paradas.map(stop => stop.pedido_id);
  if (!orders.length) return;
  const orderStops = await db.paradaRuta.findMany({ where: { pedido_id: { in: orders }, ruta_version: { ruta: activeOther } }, select: { ruta_version: { select: { numero: true, ruta: { select: { current_version: true } } } } } });
  if (orderStops.some(stop => current(stop.ruta_version))) throw new ConflictException('Uno o más pedidos de la ruta ya pertenecen a otra ruta activa.');
}

function driverIneligibility(driver: DriverState, busy: boolean): string | null {
  if (driver.estado !== 'ACTIVO') return 'El conductor no está activo.';
  if (!driver.usuario || driver.usuario.estado !== 'ACTIVO') return 'El conductor no tiene una cuenta activa.';
  if (driver.usuario.rol.nombre !== DRIVER_ROLE) return 'La cuenta del conductor no tiene rol Conductor.';
  if (!driver.disponibilidades.length) return 'El conductor no tiene disponibilidad para toda la jornada calculada.';
  return busy ? 'El conductor ya tiene otra ruta activa.' : null;
}

/** Única evaluación de elegibilidad de conductores, compartida por candidates() y assign(). */
async function evaluateDrivers(db: Prisma.TransactionClient, routeId: string, ids: string[], start: Date, end: Date) {
  const drivers = await db.conductor.findMany({
    where: { conductor_id: { in: ids } },
    orderBy: [{ nombre_completo: 'asc' }, { conductor_id: 'asc' }],
    select: {
      conductor_id: true, nombre_completo: true, estado: true,
      usuario: { select: { estado: true, rol: { select: { nombre: true } } } },
      disponibilidades: { where: { estado: 'DISPONIBLE', inicio: { lte: start }, fin: { gte: end } }, take: 1, select: { disponibilidad_id: true } },
    },
  });
  const busyRoutes = await db.ruta.findMany({ where: { conductor_id: { in: ids }, estado: { in: ACTIVE_ROUTE_STATES }, ruta_id: { not: routeId } }, select: { conductor_id: true } });
  const busy = new Set(busyRoutes.map(route => route.conductor_id));
  return drivers.map(driver => ({ conductor_id: driver.conductor_id, nombre_completo: driver.nombre_completo, motivo: driverIneligibility(driver, busy.has(driver.conductor_id)) }));
}

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(q: RouteQueryDto) {
    if (q.desde && q.hasta && +new Date(q.hasta) < +new Date(q.desde)) throw new BadRequestException('El rango de fechas no es válido.');
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = q;
    const where: Prisma.RutaWhereInput = { ...(q.alternativa_id ? { alternativa_id: q.alternativa_id } : {}), ...(q.desde || q.hasta ? { creado_en: { ...(q.desde ? { gte: new Date(q.desde) } : {}), ...(q.hasta ? { lte: new Date(q.hasta) } : {}) } } : {}), alternativa: { ...(q.metodo ? { metodo: q.metodo } : {}), ejecucion: { version: { ...(q.planificacion_id ? { planificacion_id: q.planificacion_id } : {}), ...(q.search?.trim() ? { OR: [{ planificacion: { etiqueta: { contains: q.search.trim(), mode: 'insensitive' } } }, ...(isUUID(q.search.trim()) ? [{ planificacion_id: q.search.trim() }] : [])] } : {}) } } } };
    if (q.search && isUUID(q.search.trim())) { delete where.alternativa!.ejecucion!.version!.OR; where.OR = [{ ruta_id: q.search.trim() }, { alternativa: { ejecucion: { version: { planificacion_id: q.search.trim() } } } }]; }
    try { const [items, total] = await this.prisma.$transaction([this.prisma.ruta.findMany({ where, orderBy: [{ creado_en: 'desc' }, { ruta_id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize, include: { alternativa: { include: { ejecucion: { select: { version: { select: { planificacion: { select: { planificacion_id: true, etiqueta: true } } } } } } } }, versiones: { select: { numero: true, distancia_m: true, duracion_s: true }, orderBy: { numero: 'desc' }, take: 1 } } }), this.prisma.ruta.count({ where })], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }); return { items, total, page, pageSize }; } catch (cause) { routingDatabaseError(cause); }
  }
  async get(id: string, version?: number) {
    if (version !== undefined && (!Number.isSafeInteger(version) || version < 1)) throw new BadRequestException('La versión de ruta debe ser un entero positivo.');
    try {
      const route = await this.prisma.ruta.findUnique({ where: { ruta_id: id }, include: { conductor: { select: { conductor_id: true, nombre_completo: true } }, alternativa: { include: { ejecucion: { select: { ejecucion_id: true, version: { select: { numero: true, planificacion_id: true, snapshot: true, planificacion: { select: { etiqueta: true } } } } } } } }, versiones: { where: version !== undefined ? { numero: version } : undefined, orderBy: { numero: 'desc' }, take: 1, include: { paradas: { orderBy: { secuencia: 'asc' }, include: STOP_ORDER_STATE } } }, confirmador: { select: { email: true } } } });
      if (!route || !route.versiones.length) throw new NotFoundException('Ruta o versión no encontrada.');
      const current = route.versiones[0];
      const warnings = stopWarnings(current.paradas);
      const historic = route.alternativa?.ejecucion?.version;
      if (historic?.snapshot) {
        const snapshot = historic.snapshot as unknown as PreparedSnapshot;
        warnings.push(...await sourceWarnings(this.prisma, snapshot));
        const { snapshot: privateSnapshot, ...metadata } = historic; void privateSnapshot;
        return { ...route, alternativa: { ...route.alternativa, ejecucion: { ...route.alternativa.ejecucion, version: metadata } }, current_warnings: warnings };
      }
      return { ...route, current_warnings: warnings };
    } catch (cause) { routingDatabaseError(cause); }
  }

  /** US-020: confirma la versión actual si no hay condiciones pendientes; si las hay, las enumera. */
  async confirm(id: string, dto: ConfirmRouteDto, actorId: string) {
    try {
      return await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT ruta_id FROM rutas WHERE ruta_id=${id}::uuid FOR UPDATE`;
        const route = await tx.ruta.findUnique({
          where: { ruta_id: id },
          select: {
            estado: true, conductor_id: true, current_version: true, alternativa: ASSIGNMENT_ROUTE.alternativa,
            versiones: { orderBy: { numero: 'desc' }, take: 1, select: { vehiculo_id: true, resultado: true, paradas: { include: STOP_ORDER_STATE } } },
          },
        });
        if (!route) throw new NotFoundException('Ruta no encontrada.');
        if (route.estado !== dto.expected_estado || route.conductor_id !== null) {
          throw new ConflictException('La ruta ya fue confirmada o cambió de estado. Recarga antes de reintentar.');
        }
        const { version, confirmable, start, end } = calculatedVersion(route);
        if (!version) throw new ConflictException('La ruta no tiene una versión disponible para confirmar.');
        const pending: string[] = [];
        if (!confirmable) pending.push('La versión actual no es confirmable: revisa las restricciones del cálculo.');
        if (!start || !end) pending.push('La versión actual no tiene la jornada calculada.');
        const snapshot = route.alternativa.ejecucion.version.snapshot as unknown as PreparedSnapshot;
        pending.push(...pendingConditions([...stopWarnings(version.paradas), ...await sourceWarnings(tx, snapshot)]));
        try { await assertRouteResources(tx, id, version); }
        catch (cause) { if (cause instanceof ConflictException) pending.push(cause.message); else throw cause; }
        if (pending.length) throw new ConflictException(`No se puede confirmar la ruta. Condiciones pendientes: ${[...new Set(pending)].join(' ')}`);
        const changed = await tx.ruta.updateMany({
          where: { ruta_id: id, conductor_id: null, estado: CONFIRMABLE_ROUTE_STATE },
          data: { estado: ASSIGNABLE_ROUTE_STATE, confirmado_en: new Date(), confirmado_por: actorId, version_confirmada: route.current_version },
        });
        if (changed.count !== 1) throw new ConflictException('La ruta cambió durante la confirmación. Recarga antes de reintentar.');
        return tx.ruta.findUniqueOrThrow({ where: { ruta_id: id }, select: CONFIRMATION_RESULT });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 3000 });
    } catch (cause) {
      routingDatabaseError(cause);
    }
  }

  async candidates(id: string): Promise<AssignmentCandidate[]> {
    try {
      const route = await this.prisma.ruta.findUnique({ where: { ruta_id: id }, select: { estado: true, conductor_id: true, current_version: true, version_confirmada: true, ...ASSIGNMENT_ROUTE } });
      if (!route) throw new NotFoundException('Ruta no encontrada.');
      const { version, snapshot, start, end } = assignableRoute(route);
      await assertRouteResources(this.prisma, id, version);
      const drivers = await evaluateDrivers(this.prisma, id, snapshot.drivers.map(driver => driver.conductor_id), start, end);
      return drivers.filter(driver => driver.motivo === null).map(({ conductor_id, nombre_completo }) => ({ conductor_id, nombre_completo }));
    } catch (cause) { routingDatabaseError(cause); }
  }

  async assign(id: string, dto: AssignRouteDto) {
    try {
      return await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT ruta_id FROM rutas WHERE ruta_id=${id}::uuid FOR UPDATE`;
        const route = await tx.ruta.findUnique({ where: { ruta_id: id }, select: { estado: true, conductor_id: true, current_version: true, version_confirmada: true, ...ASSIGNMENT_ROUTE } });
        if (!route) throw new NotFoundException('Ruta no encontrada.');
        if (route.estado !== dto.expected_estado && route.estado !== CONFIRMABLE_ROUTE_STATE) {
          throw new ConflictException('La ruta ya fue asignada o cambió de estado. Recarga antes de reintentar.');
        }
        const { version, snapshot, start, end } = assignableRoute(route);
        if (!snapshot.drivers.some(driver => driver.conductor_id === dto.conductor_id)) {
          throw new ConflictException('El conductor no pertenece a los candidatos validados de esta planificación.');
        }
        await assertRouteResources(tx, id, version);
        const [driver] = await evaluateDrivers(tx, id, [dto.conductor_id], start, end);
        if (!driver) throw new NotFoundException('Conductor no encontrado.');
        if (driver.motivo) throw new ConflictException(driver.motivo);
        const assignedAt = new Date();
        const changed = await tx.ruta.updateMany({
          where: { ruta_id: id, conductor_id: null, estado: ASSIGNABLE_ROUTE_STATE },
          data: { conductor_id: dto.conductor_id, estado: 'ASIGNADA', asignado_en: assignedAt },
        });
        if (changed.count !== 1) throw new ConflictException('La ruta cambió durante la asignación. Recarga antes de reintentar.');
        return tx.ruta.findUniqueOrThrow({
          where: { ruta_id: id },
          select: {
            ruta_id: true, estado: true, asignado_en: true, current_version: true,
            conductor: { select: { conductor_id: true, nombre_completo: true } },
          },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 3000 });
    } catch (cause) {
      routingDatabaseError(cause);
    }
  }}
