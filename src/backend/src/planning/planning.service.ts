import { BadRequestException, ConflictException, GatewayTimeoutException, HttpException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CoverageService } from '../coverage/coverage.service';
import { OsrmAdapter } from '../routing/osrm.adapter';
import { evaluateRoute, makeHash, routeCandidates, type PreparedSnapshot, type RouteCandidate } from './planning-domain';
import { assertPoint, lockSnapshot, period, prepareSnapshot, routingDatabaseError, sourceInput, sources } from './planning-data';
import { CalculatePlanningDto, PeriodDto, PreparePlanningDto, UpdatePlanningDto } from './dto/planning.dto';
const remainingTime = (deadline: number) => { const remaining = Math.floor(deadline - Date.now()); if (remaining <= 0) throw new GatewayTimeoutException('El cálculo excedió su tiempo máximo total. No se publicó ningún recorrido.'); return remaining; };
const transactionBudget = (deadline: number) => { const timeout = remainingTime(deadline); return { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout, maxWait: Math.min(2000, timeout) }; };
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const publicExecution = { ejecucion_id: true, estado: true, error_code: true, creado_en: true, finalizado_en: true, alternativas: { orderBy: { numero: 'asc' }, select: { alternativa_id: true, numero: true, metodo: true, rutas: { select: { ruta_id: true } } } } } as const;
@Injectable()
export class PlanningService implements OnModuleInit, OnModuleDestroy {
  private busy = false; private timer?: ReturnType<typeof setInterval>;
  private readonly pending = new Map<string, { hash: string; registered: Promise<string | undefined> }>();
  private readonly maintenance = new Set<Promise<unknown>>();
  constructor(private readonly prisma: PrismaService, private readonly coverage: CoverageService, private readonly osrm: OsrmAdapter) {}
  onModuleInit() { this.timer = setInterval(() => { void this.recover(); }, 60000); this.timer.unref(); void this.recover(); }
  async onModuleDestroy() { if (this.timer) clearInterval(this.timer); await Promise.allSettled(this.maintenance); }
  private budgeted<T>(deadline: number, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(async tx => { await tx.$queryRaw`SELECT set_config('statement_timeout', ${String(remainingTime(deadline))}, true)`; const result = await operation(tx); remainingTime(deadline); return result; }, transactionBudget(deadline));
  }
  private failLater(executionId: string, owner: string, cause: unknown) {
    // Bounded maintenance is independent of the HTTP calculation budget and never retains busy.
    const task = this.prisma.$transaction(async tx => { await tx.$queryRaw`SELECT set_config('statement_timeout', '1000', true)`; await tx.ejecucionCalculo.updateMany({ where: { ejecucion_id: executionId, estado: 'EN_CURSO', owner_token: owner }, data: { estado: 'FALLIDA', error_code: cause instanceof HttpException ? `HTTP_${cause.getStatus()}` : 'CALCULATION_FAILED', finalizado_en: new Date() } }); }, { timeout: 1000, maxWait: 200 }).catch(() => undefined);
    this.maintenance.add(task); void task.finally(() => this.maintenance.delete(task));
  }
  private async recover() { try { await this.prisma.ejecucionCalculo.updateMany({ where: { estado: 'EN_CURSO', vence_en: { lt: new Date() } }, data: { estado: 'INTERRUMPIDA', error_code: 'PROCESS_INTERRUPTED', finalizado_en: new Date() } }); } catch { /* Unprovisioned routing tables must not prevent authentication. */ } }
  async candidates(query: PeriodDto) {
    const { start, end } = period(query.inicio, query.fin); this.coverage.assertAvailable();
    const { page = 1, pageSize = 20 } = query;
    const where = { estado: 'PENDIENTE', ventana_inicio: { lte: end }, ventana_fin: { gte: start }, cliente: { estado: 'ACTIVO' } };
    const [orders, total, vehicles, drivers] = await this.prisma.$transaction([
      this.prisma.pedido.findMany({ where, orderBy: [{ creado_en: 'asc' }, { pedido_id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize, select: { pedido_id: true, peso_kg: true, volumen_m3: true, ventana_inicio: true, ventana_fin: true, cliente: { select: { direccion: true, latitud: true, longitud: true } } } }), this.prisma.pedido.count({ where }),
      this.prisma.vehiculo.findMany({ where: { estado: 'DISPONIBLE' }, orderBy: { placa: 'asc' }, take: 100, select: { vehiculo_id: true, placa: true, capacidad_carga_kg: true, capacidad_volumen_m3: true } }),
      this.prisma.conductor.findMany({ where: { estado: 'ACTIVO', disponibilidades: { some: { estado: 'DISPONIBLE', inicio: { lte: start }, fin: { gte: end } } } }, orderBy: { nombre_completo: 'asc' }, take: 100, select: { conductor_id: true, nombre_completo: true } }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return { items: orders.map(o => { let eligible = true; try { assertPoint(this.coverage, { latitud: Number(o.cliente.latitud), longitud: Number(o.cliente.longitud) }); } catch { eligible = false; } return { ...o, eligible, reason: eligible ? null : 'DESTINO_FUERA_DE_COBERTURA' }; }), total, page, pageSize, vehicles, drivers, resourceLimit: 100 };
  }
  async prepare(dto: PreparePlanningDto, actor: string) { try { return await this.prisma.$transaction(async tx => { const snapshot = await prepareSnapshot(tx, dto, this.coverage); return tx.planificacion.create({ data: { etiqueta: dto.etiqueta.trim(), creado_por: actor, versiones: { create: { numero: 1, snapshot: json(snapshot), input_hash: makeHash(snapshot) } } }, include: { versiones: true } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }); } catch (cause) { routingDatabaseError(cause); } }
  async get(id: string) { try { const row = await this.prisma.planificacion.findUnique({ where: { planificacion_id: id }, include: { versiones: { orderBy: { numero: 'desc' }, include: { ejecuciones: { select: publicExecution } } } } }); if (!row) throw new NotFoundException('Planificación no encontrada.'); return row; } catch (cause) { routingDatabaseError(cause); } }
  async update(id: string, dto: UpdatePlanningDto) { try { return await this.prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT planificacion_id FROM planificaciones WHERE planificacion_id=${id}::uuid FOR UPDATE`;
    const plan = await tx.planificacion.findUnique({ where: { planificacion_id: id }, include: { versiones: { include: { ejecuciones: { include: { alternativas: true } } } } } });
    if (!plan) throw new NotFoundException('Planificación no encontrada.');
    if (plan.current_version !== dto.expected_version || plan.versiones.some(v => v.ejecuciones.some(e => e.estado === 'EN_CURSO' || e.alternativas.length))) throw new ConflictException('La planificación cambió, tiene un cálculo en curso o ya tiene alternativas.');
    const snapshot = await prepareSnapshot(tx, dto, this.coverage); return tx.planificacion.update({ where: { planificacion_id: id }, data: { etiqueta: dto.etiqueta.trim(), current_version: { increment: 1 }, versiones: { create: { numero: plan.current_version + 1, snapshot: json(snapshot), input_hash: makeHash(snapshot) } } }, include: { versiones: true } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); } catch (cause) { routingDatabaseError(cause); } }
  async execution(id: string, executionId: string) { try { const value = await this.prisma.ejecucionCalculo.findFirst({ where: { ejecucion_id: executionId, version: { planificacion_id: id } }, select: publicExecution }); if (!value) throw new NotFoundException('Ejecución no encontrada.'); return value; } catch (cause) { routingDatabaseError(cause); } }
  async calculate(id: string, dto: CalculatePlanningDto, actor: string, key: string) { return this.run(id, dto, actor, key, false); }
  async generateAlternatives(id: string, dto: CalculatePlanningDto, actor: string, key: string) { return this.run(id, dto, actor, key, true); }
  private result<T extends { alternativas?: unknown[] }>(state: T, replay: boolean, alternativas: boolean, count = state.alternativas?.length ?? 0) { return { ...state, replay, ...(alternativas ? { alternativas_generadas: count, solo_una_alternativa: count === 1 } : {}) }; }
  private async run(id: string, dto: CalculatePlanningDto, actor: string, key: string, alternativas: boolean) {
    const deadline = Date.now() + (this.osrm.totalTimeoutMs ?? 20000);
    const marker = actor + ':' + key; const hash = makeHash(alternativas ? { id, dto, alternativas: true } : { id, dto }); const pending = this.pending.get(marker);
    if (pending) { if (pending.hash !== hash) throw new ConflictException('La clave de idempotencia ya corresponde a otra solicitud.'); const executionId = await pending.registered; if (!executionId) throw new ConflictException('La solicitud anterior no pudo iniciar. Revisa sus datos.'); const state = await this.budgeted(deadline, tx => tx.ejecucionCalculo.findFirst({ where: { ejecucion_id: executionId, version: { planificacion_id: id } }, select: publicExecution })); if (!state) throw new NotFoundException('Ejecución no encontrada.'); return this.result(state, true, alternativas); }
    let registered!: (id?: string) => void; const registration = new Promise<string | undefined>(resolve => { registered = resolve; }); this.pending.set(marker, { hash, registered: registration });
    try { return await this.runOnce(id, dto, actor, key, registered, deadline, alternativas); } finally { registered(); this.pending.delete(marker); }
  }
  private async runOnce(id: string, dto: CalculatePlanningDto, actor: string, key: string, registered: (id: string) => void, deadline: number, alternativas: boolean) {
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(key ?? '')) throw new BadRequestException('Indica una clave de idempotencia válida.');
    const requestHash = makeHash(alternativas ? { id, dto, alternativas: true } : { id, dto });
    try { const old = await this.budgeted(deadline, tx => tx.ejecucionCalculo.findUnique({ where: { actor_id_idempotency_key: { actor_id: actor, idempotency_key: key } }, select: { ...publicExecution, request_hash: true } })); if (old) { if (old.request_hash !== requestHash) throw new ConflictException('La clave de idempotencia ya corresponde a otra solicitud.'); const { request_hash, ...result } = old; void request_hash; return this.result(result, true, alternativas); } } catch (cause) { routingDatabaseError(cause); }
    if (this.busy) throw new HttpException('Ya hay un cálculo en curso. Espera antes de reintentar.', 429); this.busy = true;
    let executionId: string | undefined; const owner = randomUUID();
    try {
      remainingTime(deadline);
      const version = await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT set_config('statement_timeout', ${String(remainingTime(deadline))}, true)`;
        await tx.$queryRaw`SELECT planificacion_id FROM planificaciones WHERE planificacion_id=${id}::uuid FOR UPDATE`;
        const plan = await tx.planificacion.findUnique({ where: { planificacion_id: id } }); if (!plan) throw new NotFoundException('Planificación no encontrada.'); if (plan.current_version !== dto.expected_version) throw new ConflictException('La versión de planificación cambió.');
        const v = await tx.planificacionVersion.findUniqueOrThrow({ where: { planificacion_id_numero: { planificacion_id: id, numero: dto.expected_version } } });
        const snapshot = v.snapshot as unknown as PreparedSnapshot; if (makeHash(snapshot) !== v.input_hash) throw new ConflictException('Integridad de planificación inválida.');
        if (makeHash(await sources(tx, sourceInput(snapshot))) !== snapshot.source_hash) throw new ConflictException('Los pedidos o recursos cambiaron. Prepara una versión nueva.');
        assertPoint(this.coverage, snapshot.origin); snapshot.orders.forEach(o => assertPoint(this.coverage, o));
        const execution = await tx.ejecucionCalculo.create({ data: { version_id: v.version_id, actor_id: actor, idempotency_key: key, request_hash: requestHash, owner_token: owner, vence_en: new Date(Date.now() + 60000) } }); executionId = execution.ejecucion_id; return v;
      }, transactionBudget(deadline));
      registered(executionId!);
      const snapshot = version.snapshot as unknown as PreparedSnapshot;
      if (alternativas && !snapshot.orders.length) throw new ConflictException('La planificación no contiene pedidos. Prepara una versión válida antes de generar alternativas.');
      const plans: RouteCandidate[] = alternativas ? routeCandidates(snapshot) : [{ codigo: 'ORDEN_CONFIRMADO', metodo: 'SECUENCIAL_OSRM', nombre: 'Orden confirmado', descripcion: '', orders: snapshot.orders }];
      const computed: { plan: RouteCandidate; evaluation: ReturnType<typeof evaluateRoute>; result: Awaited<ReturnType<OsrmAdapter['calculate']>> }[] = [];
      for (const plan of plans) {
        remainingTime(deadline);
        const candidate = { ...snapshot, orders: plan.orders }; const points = [snapshot.origin, ...plan.orders, ...(snapshot.return_to_origin ? [snapshot.origin] : [])];
        const result = await this.osrm.calculate(points, AbortSignal.timeout(Math.max(1, deadline - Date.now())));
        result.snapped.forEach(point => assertPoint(this.coverage, { latitud: Number(point.latitud.toFixed(6)), longitud: Number(point.longitud.toFixed(6)) }));
        computed.push({ plan, result, evaluation: evaluateRoute(candidate, result.legs) });
      }
      remainingTime(deadline);
      const completed = await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT set_config('statement_timeout', ${String(remainingTime(deadline))}, true)`;
        await tx.$queryRaw`SELECT planificacion_id FROM planificaciones WHERE planificacion_id=${id}::uuid FOR UPDATE`;
        await lockSnapshot(tx, snapshot);
        const plan = await tx.planificacion.findUniqueOrThrow({ where: { planificacion_id: id } });
        if (plan.current_version !== dto.expected_version || makeHash(await sources(tx, sourceInput(snapshot))) !== snapshot.source_hash) throw new ConflictException('Los pedidos o recursos cambiaron durante el cálculo. No se registró la ruta.');
        const lease = await tx.ejecucionCalculo.updateMany({ where: { ejecucion_id: executionId!, estado: 'EN_CURSO', owner_token: owner, vence_en: { gt: new Date() } }, data: { estado: 'EN_CURSO' } }); if (lease.count !== 1) throw new ConflictException('La ejecución perdió vigencia.');
        for (const [index, item] of computed.entries()) {
          const resultado = { ...item.result, ...item.evaluation, origin: snapshot.origin, return_to_origin: snapshot.return_to_origin, inicio: snapshot.inicio, coverage: snapshot.coverage, metodo: 'SECUENCIAL_OSRM', optimized: false, ...(alternativas ? { estrategia: { codigo: item.plan.codigo, nombre: item.plan.nombre, descripcion: item.plan.descripcion }, orden: item.plan.orders.map(o => o.pedido_id) } : {}) };
          await tx.alternativaRuta.create({ data: { ejecucion_id: executionId!, ...(alternativas ? { numero: index + 1, metodo: item.plan.metodo } : {}), rutas: { create: { versiones: { create: { vehiculo_id: snapshot.vehicle.vehiculo_id, distancia_m: item.result.distance_m, duracion_s: item.result.duration_s, input_hash: alternativas ? makeHash({ version: version.input_hash, orden: item.plan.orders.map(o => o.pedido_id) }) : version.input_hash, resultado: json(resultado), paradas: { create: item.evaluation.stops.map(stop => ({ pedido_id: stop.pedido_id, secuencia: stop.sequence, datos: json(stop) })) } } } } } } });
        }
        remainingTime(deadline);
        const changed = await tx.ejecucionCalculo.updateMany({ where: { ejecucion_id: executionId!, estado: 'EN_CURSO', owner_token: owner, vence_en: { gt: new Date() } }, data: { estado: 'COMPLETADA', finalizado_en: new Date() } }); if (changed.count !== 1) throw new ConflictException('La ejecución perdió vigencia.');
        remainingTime(deadline);
        const state = await tx.ejecucionCalculo.findFirst({ where: { ejecucion_id: executionId! }, select: publicExecution }); if (!state) throw new ConflictException('No se pudo confirmar el resultado de la ejecución.'); remainingTime(deadline); return this.result(state, false, alternativas, alternativas ? computed.length : undefined);
      }, transactionBudget(deadline));
      return completed;
    } catch (cause) { let failure: unknown; try { if (Date.now() >= deadline) throw new GatewayTimeoutException('El cálculo excedió su tiempo máximo total. No se publicó ningún recorrido.'); routingDatabaseError(cause); } catch (value) { failure = value; } if (executionId) this.failLater(executionId, owner, failure); const status = failure instanceof HttpException ? failure.getStatus() : 500; throw new HttpException({ message: status === 500 ? 'No se pudo registrar el recorrido. No se conservaron resultados parciales.' : (failure as HttpException).message, code: `ROUTING_${status}`, ...(executionId ? { execution_id: executionId } : {}) }, status); }
    finally { this.busy = false; }
  }
}
