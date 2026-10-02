import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './order.dto';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}
  create(dto: CreateOrderDto) {
    const inicio = new Date(dto.ventana_inicio); const fin = new Date(dto.ventana_fin);
    if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime()) || fin <= inicio) throw new BadRequestException('La ventana de entrega debe tener un fin posterior al inicio.');
    return this.prisma.$transaction(async tx => {
      const cliente = await tx.cliente.create({ data: dto.cliente, select: { cliente_id: true } });
      return tx.pedido.create({ data: { cliente_id: cliente.cliente_id, peso_kg: dto.peso_kg, volumen_m3: dto.volumen_m3 ?? null, descripcion_carga: dto.descripcion_carga ?? null, ventana_inicio: inicio, ventana_fin: fin, prioridad: dto.prioridad, tipo_producto: dto.tipo_producto } });
    });
  }
}
