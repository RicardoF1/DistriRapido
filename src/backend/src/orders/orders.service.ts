import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { OrderQueryDto } from './order-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './order.dto';
import { isAllowedOrderTransition, ORDER_STATES } from './order-status';
import { CoverageService } from '../coverage/coverage.service';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly coverage: CoverageService) {}
  async list(query: OrderQueryDto) {
    const { page, pageSize, search, estado, prioridad, tipo_producto } = query;
    const where: Prisma.PedidoWhereInput = {
      ...(estado ? { estado } : {}), ...(prioridad ? { prioridad } : {}), ...(tipo_producto ? { tipo_producto } : {}),
      ...(search ? { OR: [
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { direccion: { contains: search, mode: 'insensitive' } } },
        ...(isUUID(search) ? [{ pedido_id: search }] : []),
      ] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.pedido.findMany({ where, include: { cliente: true }, orderBy: [{ creado_en: 'desc' }, { pedido_id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.pedido.count({ where }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return { items, total, page, pageSize };
  }
  async get(id: string) {
    const pedido = await this.prisma.pedido.findUnique({ where: { pedido_id: id }, include: { cliente: true } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado.');
    return pedido;
  }
  async updateStatus(id: string, nextState: string) {
    if (!ORDER_STATES.includes(nextState as typeof ORDER_STATES[number])) throw new BadRequestException('Estado de pedido no permitido.');
    const current = await this.prisma.pedido.findUnique({ where: { pedido_id: id }, select: { estado: true } });
    if (!current) throw new NotFoundException('Pedido no encontrado.');
    if (!isAllowedOrderTransition(current.estado, nextState as typeof ORDER_STATES[number])) {
      throw new ConflictException(`No se permite la transición de ${current.estado} a ${nextState}.`);
    }
    return this.prisma.pedido.update({ where: { pedido_id: id }, data: { estado: nextState }, include: { cliente: true } });
  }
  create(dto: CreateOrderDto) {
    const inicio = new Date(dto.ventana_inicio); const fin = new Date(dto.ventana_fin);
    if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime()) || fin <= inicio) throw new BadRequestException('La ventana de entrega debe tener un fin posterior al inicio.');
    const withinHours = (date: Date, isEnd: boolean) => {
      const lima = new Date(date.getTime() - 5 * 60 * 60 * 1000);
      const minute = lima.getUTCHours() * 60 + lima.getUTCMinutes() + lima.getUTCSeconds() / 60 + lima.getUTCMilliseconds() / 60000;
      return (minute >= 420 && (isEnd ? minute <= 780 : minute < 780)) || (minute >= 840 && (isEnd ? minute <= 1200 : minute < 1200));
    };
    if (!withinHours(inicio, false) || !withinHours(fin, true)) throw new BadRequestException('La ventana debe comenzar y terminar dentro del horario de atención: 7:00 AM–1:00 PM y 2:00 PM–8:00 PM (America/Lima). El inicio debe ser anterior al cierre del turno.');
    const point = this.coverage.assertDelivery(dto.cliente);
    return this.prisma.$transaction(async tx => {
      const cliente = await tx.cliente.create({ data: { ...dto.cliente, ...point }, select: { cliente_id: true } });
      return tx.pedido.create({ data: { cliente_id: cliente.cliente_id, peso_kg: dto.peso_kg, volumen_m3: dto.volumen_m3 ?? null, descripcion_carga: dto.descripcion_carga ?? null, ventana_inicio: inicio, ventana_fin: fin, prioridad: dto.prioridad, tipo_producto: dto.tipo_producto } });
    });
  }
}
