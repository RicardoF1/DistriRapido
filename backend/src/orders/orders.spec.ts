import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './order.dto';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderRegistrationGuard } from './order-registration.guard';
const valid = { cliente: { nombre: 'Cliente', direccion: 'Destino', latitud: -12.065, longitud: -75.204 }, peso_kg: 2.25, volumen_m3: 0.015, ventana_inicio: '2026-10-02T09:00:00-05:00', ventana_fin: '2026-10-02T11:00:00-05:00', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO' };
describe('RF-003 → US-004', () => {
  it.each(['Administrador', 'Operador / Técnico'])('autoriza %s', role => {
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: { rol: { nombre: role } } }) }) } as ExecutionContext;
    expect(new OrderRegistrationGuard().canActivate(context)).toBe(true);
  });
  it.each(['Usuario Final / Conductor', 'Auditor Externo', 'Planificador logístico', undefined])('rechaza rol %s', role => {
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: role ? { rol: { nombre: role } } : undefined }) }) } as ExecutionContext;
    expect(() => new OrderRegistrationGuard().canActivate(context)).toThrow('No tienes permisos');
  });
  it('DTO acepta valores documentados y normaliza textos', async () => {
    const dto = plainToInstance(CreateOrderDto, { ...valid, cliente: { ...valid.cliente, nombre: ' Cliente ', direccion: ' Destino ' } });
    expect(await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).toHaveLength(0);
    expect(dto.cliente.nombre).toBe('Cliente'); expect(dto.cliente.direccion).toBe('Destino');
  });
  it('acepta límites representables y coordenadas pequeñas con precisión válida', async () => {
    const dto = plainToInstance(CreateOrderDto, { ...valid, cliente: { ...valid.cliente, latitud: 1e-6, longitud: 0 }, peso_kg: 0.01, volumen_m3: 0.001 });
    expect(await validate(dto)).toHaveLength(0);
  });
  it.each([
    {}, { ...valid, cliente: null }, { ...valid, cliente: { ...valid.cliente, nombre: 12, direccion: null } },
    { ...valid, cliente: { ...valid.cliente, latitud: 91 } }, { ...valid, cliente: { ...valid.cliente, longitud: -181 } },
    { ...valid, peso_kg: 0 }, { ...valid, peso_kg: 1.001 }, { ...valid, volumen_m3: 0 }, { ...valid, volumen_m3: 0.0001 },
    { ...valid, prioridad: 'ALTA' }, { ...valid, tipo_producto: 'OTRO' }, { ...valid, ventana_inicio: '2026-10-02T09:00:00' },
    { ...valid, estado: 'ENTREGADO' }, { ...valid, cliente: { ...valid.cliente, dni: 'inventado' } },
    { ...valid, cliente: { ...valid.cliente, latitud: 1e-7 } }, { ...valid, cliente: { ...valid.cliente, longitud: -1e-7 } },
    { ...valid, peso_kg: NaN }, { ...valid, volumen_m3: Infinity }, { ...valid, peso_kg: 1e21 },
  ])('DTO rechaza datos incompletos/no documentados %#', async value => {
    expect((await validate(plainToInstance(CreateOrderDto, value), { whitelist: true, forbidNonWhitelisted: true })).length).toBeGreaterThan(0);
  });
  it('crea cliente y pedido dentro de la misma transacción sin aceptar estado/UUID del cliente', async () => {
    const result = { pedido_id: 'generated', cliente_id: 'client-id', estado: 'PENDIENTE' };
    const tx = { cliente: { create: jest.fn().mockResolvedValue({ cliente_id: 'client-id' }) }, pedido: { create: jest.fn().mockResolvedValue(result) } };
    const prisma = { $transaction: jest.fn(callback => callback(tx)) };
    const service = new OrdersService(prisma as unknown as PrismaService);
    expect(await new OrdersController(service).create(valid)).toEqual(result);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.pedido.create).toHaveBeenCalledWith({ data: { cliente_id: 'client-id', peso_kg: 2.25, volumen_m3: 0.015, ventana_inicio: new Date(valid.ventana_inicio), ventana_fin: new Date(valid.ventana_fin), prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO' } });
  });
  it.each([['invalid', valid.ventana_fin], [valid.ventana_inicio, 'invalid'], [valid.ventana_fin, valid.ventana_inicio], [valid.ventana_inicio, valid.ventana_inicio]])('rechaza ventana inválida sin iniciar transacción %s / %s', (inicio, fin) => {
    const prisma = { $transaction: jest.fn() }; const service = new OrdersService(prisma as unknown as PrismaService);
    expect(() => service.create({ ...valid, ventana_inicio: inicio, ventana_fin: fin })).toThrow('fin posterior'); expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
