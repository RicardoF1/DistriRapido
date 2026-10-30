import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CoverageService } from '../coverage/coverage.service';
import { coverageRelease } from '../coverage/generated/release';
import { makeHash, validateSequence, type Point, type PreparedSnapshot } from './planning-domain';
import type { PreparePlanningDto } from './dto/planning.dto';
export function period(inicio: string, fin: string) {
  const start = new Date(inicio); const end = new Date(fin);
  if (![inicio, fin].every(v => /(?:Z|[+-]\d{2}:\d{2})$/.test(v)) || !Number.isFinite(+start) || !Number.isFinite(+end) || +end <= +start || +end - +start > 24 * 3600000) throw new BadRequestException('La jornada requiere zona horaria explícita, hasta 24 horas y fin posterior al inicio.');
  return { start, end };
}
export function assertPoint(coverage: CoverageService, point: Point) { try { return coverage.assertDelivery(point); } catch (cause) { if (cause instanceof ServiceUnavailableException) throw new ServiceUnavailableException('Cobertura geográfica no disponible. No se puede preparar o calcular una ruta.'); throw cause; } }
export async function sources(db: Prisma.TransactionClient, input: Pick<PreparePlanningDto, 'orders' | 'vehiculo_id' | 'conductor_ids' | 'inicio' | 'fin'>) {
  const { start, end } = period(input.inicio, input.fin); const ids = input.orders.map(o => o.pedido_id); validateSequence(ids);
  const orders = await db.pedido.findMany({ where: { pedido_id: { in: ids } }, orderBy: { pedido_id: 'asc' }, select: { pedido_id: true, cliente_id: true, estado: true, peso_kg: true, volumen_m3: true, ventana_inicio: true, ventana_fin: true, prioridad: true, tipo_producto: true, cliente: { select: { direccion: true, latitud: true, longitud: true, estado: true } } } });
  const vehicle = await db.vehiculo.findUnique({ where: { vehiculo_id: input.vehiculo_id } });
  const drivers = await db.conductor.findMany({ where: { conductor_id: { in: input.conductor_ids } }, orderBy: { conductor_id: 'asc' }, select: { conductor_id: true, estado: true, disponibilidades: { where: { inicio: { lte: start }, fin: { gte: end }, estado: 'DISPONIBLE' }, orderBy: { disponibilidad_id: 'asc' }, select: { disponibilidad_id: true, inicio: true, fin: true, estado: true } } } });
  const positive = (v: unknown) => Number.isFinite(Number(v)) && Number(v) > 0;
  if (orders.some(o => !positive(o.peso_kg) || o.volumen_m3 !== null && !positive(o.volumen_m3)) || vehicle && (!positive(vehicle.capacidad_carga_kg) || vehicle.capacidad_volumen_m3 !== null && !positive(vehicle.capacidad_volumen_m3))) throw new ConflictException('Peso, capacidades y volúmenes informados deben ser finitos y positivos.');
  if (orders.length !== ids.length || orders.some(o => o.estado !== 'PENDIENTE' || o.cliente.estado !== 'ACTIVO' || +o.ventana_fin < +start || +o.ventana_inicio > +end || +o.ventana_fin <= +o.ventana_inicio || Number(o.peso_kg) <= 0)) throw new ConflictException('Los pedidos deben estar pendientes, habilitados y tener ventanas compatibles con la jornada.');
  if (!vehicle || vehicle.estado !== 'DISPONIBLE' || Number(vehicle.capacidad_carga_kg) <= 0) throw new ConflictException('Selecciona un vehículo disponible y con capacidad válida.');
  if (!drivers.length || drivers.length !== input.conductor_ids.length || drivers.some(d => d.estado !== 'ACTIVO' || !d.disponibilidades.length)) throw new ConflictException('Selecciona conductores activos con disponibilidad para toda la jornada.');
  return { orders, vehicle, drivers };
}
export async function prepareSnapshot(db: Prisma.TransactionClient, input: PreparePlanningDto, coverage: CoverageService): Promise<PreparedSnapshot> {
  if (!input.origin || !input.origin.label.trim() || !input.confirm_origin || !input.confirm_order || !input.confirm_return || typeof input.return_to_origin !== 'boolean') throw new BadRequestException('Confirma origen, orden y modalidad de finalización.');
  assertPoint(coverage, input.origin); const source = await sources(db, input);
  const orders = input.orders.map(ordered => { const row = source.orders.find(o => o.pedido_id === ordered.pedido_id)!; const point = assertPoint(coverage, { latitud: Number(row.cliente.latitud), longitud: Number(row.cliente.longitud) }); return { ...ordered, ...point, cliente_id: row.cliente_id, direccion: row.cliente.direccion, peso_kg: Number(row.peso_kg), volumen_m3: row.volumen_m3 === null ? null : Number(row.volumen_m3), ventana_inicio: row.ventana_inicio.toISOString(), ventana_fin: row.ventana_fin.toISOString() }; });
  return { origin: { ...input.origin, label: input.origin.label.trim() }, return_to_origin: input.return_to_origin, inicio: new Date(input.inicio).toISOString(), fin: new Date(input.fin).toISOString(), orders, vehicle: { vehiculo_id: source.vehicle.vehiculo_id, capacidad_carga_kg: Number(source.vehicle.capacidad_carga_kg), capacidad_volumen_m3: source.vehicle.capacidad_volumen_m3 === null ? null : Number(source.vehicle.capacidad_volumen_m3) }, drivers: source.drivers.map(d => ({ conductor_id: d.conductor_id, intervals: d.disponibilidades.map(a => ({ disponibilidad_id: a.disponibilidad_id, inicio: a.inicio.toISOString(), fin: a.fin.toISOString() })) })), source_hash: makeHash(source), coverage: { version: coverageRelease.version, hash: makeHash(coverageRelease.files_sha256) } };
}
export const sourceInput = (s: PreparedSnapshot) => ({ orders: s.orders, vehiculo_id: s.vehicle.vehiculo_id, conductor_ids: s.drivers.map(d => d.conductor_id), inicio: s.inicio, fin: s.fin });
export async function lockSnapshot(db: Prisma.TransactionClient, s: PreparedSnapshot) {
  const groups = [{ table: 'pedidos', key: 'pedido_id', ids: s.orders.map(o => o.pedido_id) }, { table: 'clientes', key: 'cliente_id', ids: s.orders.map(o => o.cliente_id) }, { table: 'vehiculos', key: 'vehiculo_id', ids: [s.vehicle.vehiculo_id] }, { table: 'conductores', key: 'conductor_id', ids: s.drivers.map(d => d.conductor_id) }, { table: 'disponibilidades_conductores', key: 'disponibilidad_id', ids: s.drivers.flatMap(d => d.intervals.map(i => i.disponibilidad_id)) }];
  for (const group of groups) if (group.ids.length) await db.$queryRaw(Prisma.sql`SELECT ${Prisma.raw(group.key)} FROM ${Prisma.raw(group.table)} WHERE ${Prisma.raw(group.key)} IN (${Prisma.join([...new Set(group.ids)].sort().map(id => Prisma.sql`${id}::uuid`))}) ORDER BY ${Prisma.raw(group.key)} FOR SHARE`);
}
export function routingDatabaseError(cause: unknown): never {
  if (cause instanceof Prisma.PrismaClientKnownRequestError) { if (['P2021', 'P2022'].includes(cause.code)) throw new ServiceUnavailableException('Sistema de rutas pendiente de habilitación: falta revisar y aplicar la migración autorizada.'); if (['P2034', 'P2028', 'P2002', 'P2003'].includes(cause.code)) throw new ConflictException('Los datos de planificación cambiaron. Recarga antes de reintentar.'); }
  throw cause;
}
