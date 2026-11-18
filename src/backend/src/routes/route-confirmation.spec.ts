import { ConflictException, NotFoundException } from '@nestjs/common';
import { sources } from '../planning/planning-data';
import { makeHash } from '../planning/planning-domain';
import { PrismaService } from '../prisma/prisma.service';
import { pendingConditions, RoutesService } from './routes.service';

jest.mock('../planning/planning-data', () => ({ ...jest.requireActual('../planning/planning-data'), sources: jest.fn() }));

const routeId = '00000000-0000-4000-8000-000000000011';
const actorId = '00000000-0000-4000-8000-000000000012';
const vehicleId = '00000000-0000-4000-8000-000000000013';
const orderId = '00000000-0000-4000-8000-000000000014';
const dto = { expected_estado: 'GENERADA' as const, confirmed: true as const };
const sourceRows = { orders: [{ pedido_id: orderId }], vehicle: { vehiculo_id: vehicleId }, drivers: [] };
const window = { inicio: '2030-01-01T12:00:00.000Z', fin: '2030-01-01T15:00:00.000Z' };
const snapshot = { orders: [{ pedido_id: orderId }], vehicle: { vehiculo_id: vehicleId }, drivers: [{ conductor_id: 'd' }], ...window, source_hash: makeHash(sourceRows) };
const stop = {
  pedido_id: orderId,
  datos: { direccion: 'Dirección sintética', latitud: -12, longitud: -75 },
  pedido: { estado: 'PENDIENTE', peso_kg: 2, volumen_m3: null, ventana_inicio: new Date(window.inicio), ventana_fin: new Date(window.fin), cliente: { estado: 'ACTIVO', direccion: 'Dirección sintética', latitud: -12, longitud: -75 } },
};
const route = {
  estado: 'GENERADA', conductor_id: null, current_version: 1,
  alternativa: { ejecucion: { version: { snapshot } } },
  versiones: [{ vehiculo_id: vehicleId, resultado: { confirmable: true, inicio: window.inicio, end: window.fin }, paradas: [stop] }],
};
const tx = {
  $queryRaw: jest.fn(),
  ruta: { findUnique: jest.fn(), updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
  vehiculo: { findUnique: jest.fn() },
  rutaVersion: { findMany: jest.fn() },
  paradaRuta: { findMany: jest.fn() },
};
const prisma = { $transaction: jest.fn() };
const sourcesMock = sources as jest.MockedFunction<typeof sources>;
let service: RoutesService;

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((operation: (db: typeof tx) => unknown) => operation(tx));
  sourcesMock.mockResolvedValue(sourceRows as unknown as Awaited<ReturnType<typeof sources>>);
  tx.ruta.findUnique.mockResolvedValue(route);
  tx.ruta.updateMany.mockResolvedValue({ count: 1 });
  tx.ruta.findUniqueOrThrow.mockResolvedValue({ ruta_id: routeId, estado: 'CONFIRMADA', version_confirmada: 1 });
  tx.vehiculo.findUnique.mockResolvedValue({ estado: 'DISPONIBLE' });
  tx.rutaVersion.findMany.mockResolvedValue([]);
  tx.paradaRuta.findMany.mockResolvedValue([]);
  service = new RoutesService(prisma as unknown as PrismaService);
});

const withVersion = (patch: object) => ({ ...route, versiones: [{ ...route.versiones[0], ...patch }] });
const expectPending = async (...conditions: string[]) => {
  const failure = service.confirm(routeId, dto, actorId);
  await expect(failure).rejects.toBeInstanceOf(ConflictException);
  for (const condition of conditions) await expect(service.confirm(routeId, dto, actorId)).rejects.toThrow(condition);
  expect(tx.ruta.updateMany).not.toHaveBeenCalled();
};

describe('US-020 confirmar ruta', () => {
  it('escenario 1: confirma una ruta generada y revisada, registra quién, cuándo y qué versión', async () => {
    await expect(service.confirm(routeId, dto, actorId)).resolves.toMatchObject({ estado: 'CONFIRMADA', version_confirmada: 1 });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.ruta.updateMany).toHaveBeenCalledWith({
      where: { ruta_id: routeId, conductor_id: null, estado: 'GENERADA' },
      data: { estado: 'CONFIRMADA', confirmado_en: expect.any(Date), confirmado_por: actorId, version_confirmada: 1 },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable', timeout: 15000, maxWait: 3000 });
    const [check, update] = [tx.paradaRuta.findMany.mock.invocationCallOrder[0], tx.ruta.updateMany.mock.invocationCallOrder[0]];
    expect(check).toBeLessThan(update);
  });

  it('responde 404 si la ruta no existe', async () => {
    tx.ruta.findUnique.mockResolvedValueOnce(null);
    await expect(service.confirm(routeId, dto, actorId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([
    ['CONFIRMADA', { ...route, estado: 'CONFIRMADA' }],
    ['ASIGNADA', { ...route, estado: 'ASIGNADA', conductor_id: 'd' }],
    ['EN_CURSO', { ...route, estado: 'EN_CURSO', conductor_id: 'd' }],
    ['COMPLETADA', { ...route, estado: 'COMPLETADA', conductor_id: 'd' }],
  ])('no vuelve a confirmar una ruta %s', async (_, value) => {
    tx.ruta.findUnique.mockResolvedValueOnce(value);
    await expect(service.confirm(routeId, dto, actorId)).rejects.toThrow('La ruta ya fue confirmada o cambió de estado.');
    expect(tx.ruta.updateMany).not.toHaveBeenCalled();
  });

  it('rechaza una ruta sin versión', async () => {
    tx.ruta.findUnique.mockResolvedValueOnce({ ...route, versiones: [] });
    await expect(service.confirm(routeId, dto, actorId)).rejects.toThrow('La ruta no tiene una versión disponible para confirmar.');
  });

  it('escenario 2: indica que la versión no es confirmable', async () => {
    tx.ruta.findUnique.mockResolvedValue(withVersion({ resultado: { confirmable: false, inicio: window.inicio, end: window.fin } }));
    await expectPending('Condiciones pendientes: La versión actual no es confirmable');
  });

  it('escenario 2: indica que falta la jornada calculada', async () => {
    tx.ruta.findUnique.mockResolvedValue(withVersion({ resultado: { confirmable: true } }));
    await expectPending('La versión actual no tiene la jornada calculada.');
  });

  it('escenario 2: indica pedidos que cambiaron desde el cálculo', async () => {
    tx.ruta.findUnique.mockResolvedValue(withVersion({ paradas: [{ ...stop, pedido: { ...stop.pedido, estado: 'CANCELADO' } }] }));
    await expectPending('Un pedido cambió desde el cálculo');
  });

  it('escenario 2: indica fuentes desactualizadas y recursos no disponibles', async () => {
    sourcesMock.mockResolvedValue({ ...sourceRows, drivers: [{ conductor_id: 'otro' }] } as unknown as Awaited<ReturnType<typeof sources>>);
    await expectPending('Los datos usados en el cálculo cambiaron');
    sourcesMock.mockRejectedValue(new ConflictException('Selecciona un vehículo disponible y con capacidad válida.'));
    await expectPending('El vehículo, los conductores o los pedidos del cálculo ya no están disponibles.');
  });

  it('escenario 2: indica vehículo no disponible o pedidos en otra ruta activa', async () => {
    tx.vehiculo.findUnique.mockResolvedValue({ estado: 'MANTENIMIENTO' });
    await expectPending('El vehículo de la ruta no está disponible.');
    tx.vehiculo.findUnique.mockResolvedValue({ estado: 'DISPONIBLE' });
    tx.paradaRuta.findMany.mockResolvedValue([{ ruta_version: { numero: 1, ruta: { current_version: 1 } } }]);
    await expectPending('Uno o más pedidos de la ruta ya pertenecen a otra ruta activa.');
    expect(tx.paradaRuta.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { pedido_id: { in: [orderId] }, ruta_version: { ruta: { ruta_id: { not: routeId }, estado: { in: ['CONFIRMADA', 'ASIGNADA', 'EN_CURSO'] } } } } }));
  });

  it('enumera todas las condiciones pendientes en un solo mensaje', async () => {
    tx.ruta.findUnique.mockResolvedValue(withVersion({ resultado: { confirmable: false } }));
    tx.vehiculo.findUnique.mockResolvedValue({ estado: 'MANTENIMIENTO' });
    await expect(service.confirm(routeId, dto, actorId)).rejects.toThrow(
      'No se puede confirmar la ruta. Condiciones pendientes: La versión actual no es confirmable: revisa las restricciones del cálculo. La versión actual no tiene la jornada calculada. El vehículo de la ruta no está disponible.',
    );
  });

  it('propaga errores de infraestructura sin convertirlos en condiciones', async () => {
    sourcesMock.mockRejectedValue(new Error('infrastructure failure'));
    await expect(service.confirm(routeId, dto, actorId)).rejects.toThrow('infrastructure failure');
    sourcesMock.mockResolvedValue(sourceRows as unknown as Awaited<ReturnType<typeof sources>>);
    tx.vehiculo.findUnique.mockRejectedValue(new Error('vehicle lookup failure'));
    await expect(service.confirm(routeId, dto, actorId)).rejects.toThrow('vehicle lookup failure');
    expect(tx.ruta.updateMany).not.toHaveBeenCalled();
  });

  it('carrera de doble confirmación: si la ruta cambió, no confirma', async () => {
    tx.ruta.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.confirm(routeId, dto, actorId)).rejects.toThrow('La ruta cambió durante la confirmación.');
    expect(tx.ruta.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});

describe('pendingConditions', () => {
  it('agrupa pedidos desactualizados y traduce cada advertencia', () => {
    expect(pendingConditions([])).toEqual([]);
    expect(pendingConditions(['PEDIDO_DESACTUALIZADO:a', 'PEDIDO_DESACTUALIZADO:b', 'FUENTES_DESACTUALIZADAS', 'RECURSOS_O_PEDIDOS_NO_DISPONIBLES'])).toEqual([
      '2 pedidos cambiaron desde el cálculo (estado, cliente, dirección, carga o ventana horaria).',
      'Los datos usados en el cálculo cambiaron; genera una nueva planificación.',
      'El vehículo, los conductores o los pedidos del cálculo ya no están disponibles.',
    ]);
  });
});
