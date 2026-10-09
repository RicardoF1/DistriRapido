import { ConflictException, ExecutionContext, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderConsultationGuard } from './order-consultation.guard';
import { ROLE_NAMES } from '../roles/roles';

describe('US-006 actualizar estado', () => {
  const order = { pedido_id: 'order-id', estado: 'PENDIENTE' };
  const prisma = {
    pedido: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: OrdersService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new OrdersService(prisma as unknown as PrismaService, {} as never);
    prisma.pedido.findUnique.mockResolvedValue(order);
    prisma.pedido.update.mockResolvedValue({ ...order, estado: 'EN_PREPARACION', cliente: {} });
  });

  it('persiste una transición permitida y devuelve el pedido actualizado', async () => {
    const result = await new OrdersController(service).updateStatus(order.pedido_id, { estado: 'EN_PREPARACION' });
    expect(result.estado).toBe('EN_PREPARACION');
    expect(prisma.pedido.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { pedido_id: order.pedido_id },
      data: { estado: 'EN_PREPARACION' },
      include: { cliente: true },
    }));
  });

  it.each([
    ['PENDIENTE', 'ENTREGADO'],
    ['EN_PREPARACION', 'PENDIENTE'],
    ['ENTREGADO', 'CANCELADO'],
    ['CANCELADO', 'EN_RUTA'],
  ])('rechaza transición %s -> %s sin persistir', async (from, to) => {
    prisma.pedido.findUnique.mockResolvedValue({ ...order, estado: from });
    await expect(service.updateStatus(order.pedido_id, to)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.pedido.update).not.toHaveBeenCalled();
  });

  it('devuelve 404 lógico para un pedido inexistente', async () => {
    prisma.pedido.findUnique.mockResolvedValue(null);
    await expect(service.updateStatus(order.pedido_id, 'EN_PREPARACION')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('protege actualización con los mismos roles autorizados de consulta', () => {
    const guard = new OrderConsultationGuard();
    for (const role of [ROLE_NAMES.administrator, ROLE_NAMES.operator]) {
      const context = { switchToHttp: () => ({ getRequest: () => ({ user: { rol: { nombre: role } } }) }) } as ExecutionContext;
      expect(guard.canActivate(context)).toBe(true);
    }
    for (const role of [ROLE_NAMES.driver, ROLE_NAMES.auditor]) {
      const context = { switchToHttp: () => ({ getRequest: () => ({ user: { rol: { nombre: role } } }) }) } as ExecutionContext;
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos');
    }
  });
});
