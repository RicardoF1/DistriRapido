import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AdminSummaryService {
  constructor(private readonly prisma: PrismaService) {}
  async get() {
    return this.prisma.$transaction(async tx => {
      const groups = await tx.pedido.groupBy({ by: ['estado'], _count: { _all: true }, orderBy: { estado: 'asc' } });
      const totalUsers = await tx.usuario.count();
      const ordersByState = groups.map(group => ({ state: group.estado, count: group._count._all }));
      return {
        totalOrders: ordersByState.reduce((total, group) => total + group.count, 0),
        pendingOrders: ordersByState.find(group => group.state === 'PENDIENTE')?.count ?? 0,
        totalUsers, ordersByState,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }
}
