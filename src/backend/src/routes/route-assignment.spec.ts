import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { PrismaService } from '../prisma/prisma.service';

const routeId = '00000000-0000-4000-8000-000000000001';
const driverId = '00000000-0000-4000-8000-000000000002';
const dto = { conductor_id: driverId, expected_estado: 'GENERADA' as const, confirmed: true as const };
const snapshot = { drivers: [{ conductor_id: driverId }], inicio: '2030-01-01T12:00:00.000Z', fin: '2030-01-01T15:00:00.000Z' };
const route = {
  ruta_id: routeId, estado: 'GENERADA', conductor_id: null,
  alternativa: { ejecucion: { version: { snapshot } } },
  versiones: [{ resultado: { confirmable: true, inicio: snapshot.inicio, end: snapshot.fin } }],
};
const tx = {
  $queryRaw: jest.fn(),
  ruta: { findUnique: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
  conductor: { findUnique: jest.fn() },
};
const prisma = { $transaction: jest.fn() };
let service: RoutesService;

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((operation: (db: typeof tx) => unknown) => operation(tx));
  tx.ruta.findUnique.mockResolvedValue(route);
  tx.ruta.findFirst.mockResolvedValue(null);
  tx.ruta.updateMany.mockResolvedValue({ count: 1 });
  tx.ruta.findUniqueOrThrow.mockResolvedValue({ ruta_id: routeId, estado: 'ASIGNADA' });
  tx.conductor.findUnique.mockResolvedValue({
    conductor_id: driverId, estado: 'ACTIVO',
    usuario: { estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } },
    disponibilidades: [{ disponibilidad_id: 'available' }],
  });
  service = new RoutesService(prisma as unknown as PrismaService);
});

it('asigna una ruta confirmable a un conductor candidato activo y disponible', async () => {
  await expect(service.assign(routeId, dto)).resolves.toMatchObject({ estado: 'ASIGNADA' });
  expect(tx.ruta.updateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { ruta_id: routeId, conductor_id: null, estado: 'GENERADA' },
    data: expect.objectContaining({ conductor_id: driverId, estado: 'ASIGNADA' }),
  }));
});

it('rechaza ruta inexistente o ya asignada', async () => {
  tx.ruta.findUnique.mockResolvedValueOnce(null);
  await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(NotFoundException);
  tx.ruta.findUnique.mockResolvedValueOnce({ ...route, estado: 'ASIGNADA', conductor_id: driverId });
  await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
});

it('rechaza conductor ajeno a candidatos, inactivo, sin cuenta o sin disponibilidad', async () => {
  tx.ruta.findUnique.mockResolvedValueOnce({ ...route, alternativa: { ejecucion: { version: { snapshot: { ...snapshot, drivers: [] } } } } });
  await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
  tx.conductor.findUnique.mockResolvedValueOnce({ conductor_id: driverId, estado: 'INACTIVO', usuario: null, disponibilidades: [] });
  await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
  tx.conductor.findUnique.mockResolvedValueOnce({ conductor_id: driverId, estado: 'ACTIVO', usuario: { estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } }, disponibilidades: [] });
  await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
});

it('rechaza doble ocupacion y conflicto concurrente', async () => {
  tx.ruta.findFirst.mockResolvedValueOnce({ ruta_id: 'busy' });
  await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
  tx.ruta.updateMany.mockResolvedValueOnce({ count: 0 });
  await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
});