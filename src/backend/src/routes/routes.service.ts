import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { routingDatabaseError, sourceInput, sources } from '../planning/planning-data';
import { makeHash, type PreparedSnapshot } from '../planning/planning-domain';
import { RouteQueryDto } from './dto/route-query.dto';
@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(q: RouteQueryDto) {
    if (q.desde && q.hasta && +new Date(q.hasta) < +new Date(q.desde)) throw new BadRequestException('El rango de fechas no es válido.');
    const { page = 1, pageSize = 20 } = q;
    const where: Prisma.RutaWhereInput = { ...(q.alternativa_id ? { alternativa_id: q.alternativa_id } : {}), ...(q.desde || q.hasta ? { creado_en: { ...(q.desde ? { gte: new Date(q.desde) } : {}), ...(q.hasta ? { lte: new Date(q.hasta) } : {}) } } : {}), alternativa: { ...(q.metodo ? { metodo: q.metodo } : {}), ejecucion: { version: { ...(q.planificacion_id ? { planificacion_id: q.planificacion_id } : {}), ...(q.search?.trim() ? { OR: [{ planificacion: { etiqueta: { contains: q.search.trim(), mode: 'insensitive' } } }, ...(isUUID(q.search.trim()) ? [{ planificacion_id: q.search.trim() }] : [])] } : {}) } } } };
    if (q.search && isUUID(q.search.trim())) { delete where.alternativa!.ejecucion!.version!.OR; where.OR = [{ ruta_id: q.search.trim() }, { alternativa: { ejecucion: { version: { planificacion_id: q.search.trim() } } } }]; }
    try { const [items, total] = await this.prisma.$transaction([this.prisma.ruta.findMany({ where, orderBy: [{ creado_en: 'desc' }, { ruta_id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize, include: { alternativa: { include: { ejecucion: { select: { version: { select: { planificacion: { select: { planificacion_id: true, etiqueta: true } } } } } } } }, versiones: { select: { numero: true, distancia_m: true, duracion_s: true }, orderBy: { numero: 'desc' }, take: 1 } } }), this.prisma.ruta.count({ where })], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }); return { items, total, page, pageSize }; } catch (cause) { routingDatabaseError(cause); }
  }
  async get(id: string, version?: number) {
    if (version !== undefined && (!Number.isSafeInteger(version) || version < 1)) throw new BadRequestException('La versión de ruta debe ser un entero positivo.');
    try {
      const route = await this.prisma.ruta.findUnique({ where: { ruta_id: id }, include: { alternativa: { include: { ejecucion: { select: { ejecucion_id: true, version: { select: { numero: true, planificacion_id: true, snapshot: true, planificacion: { select: { etiqueta: true } } } } } } } }, versiones: { where: version !== undefined ? { numero: version } : undefined, orderBy: { numero: 'desc' }, take: 1, include: { paradas: { orderBy: { secuencia: 'asc' }, include: { pedido: { select: { estado: true, peso_kg: true, volumen_m3: true, ventana_inicio: true, ventana_fin: true, cliente: { select: { estado: true, direccion: true, latitud: true, longitud: true } } } } } } } } } });
      if (!route || !route.versiones.length) throw new NotFoundException('Ruta o versión no encontrada.');
      const current = route.versiones[0];
      const warnings = current.paradas.flatMap(p => {
        const old = p.datos as { direccion?: string; latitud?: number; longitud?: number; peso_kg?: number; volumen_m3?: number | null; ventana_inicio?: string; ventana_fin?: string };
        const changed = p.pedido.estado !== 'PENDIENTE' || p.pedido.cliente.estado !== undefined && p.pedido.cliente.estado !== 'ACTIVO' || p.pedido.cliente.direccion !== old.direccion || Number(p.pedido.cliente.latitud) !== old.latitud || Number(p.pedido.cliente.longitud) !== old.longitud || old.peso_kg !== undefined && Number(p.pedido.peso_kg) !== old.peso_kg || old.volumen_m3 !== undefined && (p.pedido.volumen_m3 === null ? null : Number(p.pedido.volumen_m3)) !== old.volumen_m3 || old.ventana_inicio !== undefined && +p.pedido.ventana_inicio !== Date.parse(old.ventana_inicio) || old.ventana_fin !== undefined && +p.pedido.ventana_fin !== Date.parse(old.ventana_fin);
        return changed ? [`PEDIDO_DESACTUALIZADO:${p.pedido_id}`] : [];
      });
      const historic = route.alternativa?.ejecucion?.version;
      if (historic?.snapshot) {
        const snapshot = historic.snapshot as unknown as PreparedSnapshot;
        try { if (makeHash(await sources(this.prisma, sourceInput(snapshot))) !== snapshot.source_hash) warnings.push('FUENTES_DESACTUALIZADAS'); }
        catch (cause) { if (cause instanceof ConflictException) warnings.push('RECURSOS_O_PEDIDOS_NO_DISPONIBLES'); else throw cause; }
        const { snapshot: privateSnapshot, ...metadata } = historic; void privateSnapshot;
        return { ...route, alternativa: { ...route.alternativa, ejecucion: { ...route.alternativa.ejecucion, version: metadata } }, current_warnings: warnings };
      }
      return { ...route, current_warnings: warnings };
    } catch (cause) { routingDatabaseError(cause); }
  }
}
