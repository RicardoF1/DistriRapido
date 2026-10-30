import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DriverProfileService } from './driver-profile.service';
import { PrismaService } from '../prisma/prisma.service';

const user = { usuario_id: '00000000-0000-4000-8000-000000000001', email: 'driver@example.test', expiresAt: Date.now() + 60000, rol: { rol_id: '00000000-0000-4000-8000-000000000010', nombre: 'Usuario Final / Conductor' } };
const driverId = '00000000-0000-4000-8000-000000000002';
const routeId = '00000000-0000-4000-8000-000000000003';
const stopId = '00000000-0000-4000-8000-000000000004';
const stop = {
  parada_id: stopId, estado_entrega: 'PENDIENTE', version_entrega: 0,
  pedido: { pedido_id: '00000000-0000-4000-8000-000000000005', estado: 'EN_RUTA' },
  ruta_version: { numero: 1, ruta: { ruta_id: routeId, conductor_id: driverId, estado: 'ASIGNADA', current_version: 1, asignado_en: new Date(), iniciado_en: null } },
};
const tx = {
  $queryRaw: jest.fn(),
  paradaRuta: { findUnique: jest.fn(), updateMany: jest.fn(), groupBy: jest.fn(), findUniqueOrThrow: jest.fn() },
  pedido: { update: jest.fn() },
  ruta: { update: jest.fn() },
};
const prisma = {
  conductor: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};
let service: DriverProfileService;

beforeEach(() => {
  jest.resetAllMocks();
  prisma.conductor.findUnique.mockResolvedValue({ conductor_id: driverId, nombre_completo: 'Driver', estado: 'ACTIVO', usuario: { estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } } });
  prisma.$transaction.mockImplementation((operation: (db: typeof tx) => unknown) => operation(tx));
  tx.paradaRuta.findUnique.mockResolvedValue(stop);
  tx.paradaRuta.updateMany.mockResolvedValue({ count: 1 });
  tx.paradaRuta.groupBy.mockResolvedValue([{ estado_entrega: 'ENTREGADA', _count: { _all: 1 } }, { estado_entrega: 'PENDIENTE', _count: { _all: 1 } }]);
  tx.paradaRuta.findUniqueOrThrow.mockResolvedValue({ parada_id: stopId, estado_entrega: 'ENTREGADA', version_entrega: 1 });
  service = new DriverProfileService(prisma as unknown as PrismaService);
});

it('registra entrega propia, sincroniza pedido y actualiza progreso', async () => {
  const result = await service.updateDelivery(user, stopId, { estado: 'ENTREGADA', expected_version: 0 });
  expect(tx.paradaRuta.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ parada_id: stopId, version_entrega: 0 }) }));
  expect(tx.pedido.update).toHaveBeenCalledWith({ where: { pedido_id: stop.pedido.pedido_id }, data: { estado: 'ENTREGADO' } });
  expect(result.progress).toMatchObject({ total: 2, processed: 1, delivered: 1, percentage: 50 });
});

it('exige causa para no entregada y rechaza causa en entregada', async () => {
  await expect(service.updateDelivery(user, stopId, { estado: 'NO_ENTREGADA', expected_version: 0 })).rejects.toBeInstanceOf(BadRequestException);
  await expect(service.updateDelivery(user, stopId, { estado: 'ENTREGADA', causa: 'no corresponde', expected_version: 0 })).rejects.toBeInstanceOf(BadRequestException);
});

it('deniega entregas ajenas y versiones antiguas de ruta', async () => {
  tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, ruta_version: { ...stop.ruta_version, ruta: { ...stop.ruta_version.ruta, conductor_id: 'other' } } });
  await expect(service.updateDelivery(user, stopId, { estado: 'ENTREGADA', expected_version: 0 })).rejects.toBeInstanceOf(ForbiddenException);
  tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, ruta_version: { ...stop.ruta_version, numero: 0 } });
  await expect(service.updateDelivery(user, stopId, { estado: 'ENTREGADA', expected_version: 0 })).rejects.toBeInstanceOf(ConflictException);
});

it('rechaza resultado terminal, version concurrente y pedido fuera de EN_RUTA', async () => {
  tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, estado_entrega: 'ENTREGADA' });
  await expect(service.updateDelivery(user, stopId, { estado: 'ENTREGADA', expected_version: 0 })).rejects.toBeInstanceOf(ConflictException);
  tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, version_entrega: 2 });
  await expect(service.updateDelivery(user, stopId, { estado: 'ENTREGADA', expected_version: 0 })).rejects.toBeInstanceOf(ConflictException);
  tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, pedido: { ...stop.pedido, estado: 'PENDIENTE' } });
  await expect(service.updateDelivery(user, stopId, { estado: 'ENTREGADA', expected_version: 0 })).rejects.toBeInstanceOf(ConflictException);
});

it('finaliza ruta cuando todas las entregas fueron procesadas', async () => {
  tx.paradaRuta.groupBy.mockResolvedValueOnce([{ estado_entrega: 'ENTREGADA', _count: { _all: 2 } }]);
  const result = await service.updateDelivery(user, stopId, { estado: 'ENTREGADA', expected_version: 0 });
  expect(tx.ruta.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: 'COMPLETADA' }) }));
  expect(result.route.estado).toBe('COMPLETADA');
  expect(result.progress.percentage).toBe(100);
});