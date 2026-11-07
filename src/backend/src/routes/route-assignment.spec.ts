import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { PrismaService } from '../prisma/prisma.service';

const routeId = '00000000-0000-4000-8000-000000000001';
const driverId = '00000000-0000-4000-8000-000000000002';
const vehicleId = '00000000-0000-4000-8000-000000000003';
const orderId = '00000000-0000-4000-8000-000000000004';
const dto = { conductor_id: driverId, expected_estado: 'GENERADA' as const, confirmed: true as const };
const snapshot = { drivers: [{ conductor_id: driverId }], inicio: '2030-01-01T12:00:00.000Z', fin: '2030-01-01T15:00:00.000Z' };
const route = {
  ruta_id: routeId, estado: 'GENERADA', conductor_id: null,
  alternativa: { ejecucion: { version: { snapshot } } },
  versiones: [{ vehiculo_id: vehicleId, resultado: { confirmable: true, inicio: snapshot.inicio, end: snapshot.fin }, paradas: [{ pedido_id: orderId }] }],
};
const activeDriver = {
  conductor_id: driverId, nombre_completo: 'Conductor sintético', estado: 'ACTIVO',
  usuario: { estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } },
  disponibilidades: [{ disponibilidad_id: 'available' }],
};
const otherActive = { ruta_id: { not: routeId }, estado: { in: ['ASIGNADA', 'EN_CURSO'] } };
const tx = {
  $queryRaw: jest.fn(),
  ruta: { findUnique: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
  conductor: { findMany: jest.fn() },
  vehiculo: { findUnique: jest.fn() },
  rutaVersion: { findMany: jest.fn() },
  paradaRuta: { findMany: jest.fn() },
};
const prisma = { $transaction: jest.fn(), ruta: tx.ruta, conductor: tx.conductor, vehiculo: tx.vehiculo, rutaVersion: tx.rutaVersion, paradaRuta: tx.paradaRuta };
let service: RoutesService;

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((operation: (db: typeof tx) => unknown) => operation(tx));
  tx.ruta.findUnique.mockResolvedValue(route);
  tx.ruta.findMany.mockResolvedValue([]);
  tx.ruta.updateMany.mockResolvedValue({ count: 1 });
  tx.ruta.findUniqueOrThrow.mockResolvedValue({ ruta_id: routeId, estado: 'ASIGNADA' });
  tx.conductor.findMany.mockResolvedValue([activeDriver]);
  tx.vehiculo.findUnique.mockResolvedValue({ estado: 'DISPONIBLE' });
  tx.rutaVersion.findMany.mockResolvedValue([]);
  tx.paradaRuta.findMany.mockResolvedValue([]);
  service = new RoutesService(prisma as unknown as PrismaService);
});

const withVersion = (patch: object) => ({ ...route, versiones: [{ ...route.versiones[0], ...patch }] });
const expectRejected = async (message: string | RegExp) => {
  await expect(service.assign(routeId, dto)).rejects.toThrow(message);
  expect(tx.ruta.updateMany).not.toHaveBeenCalled();
};

describe('asignación de ruta', () => {
  it('asigna una ruta confirmable a un conductor candidato activo y disponible', async () => {
    await expect(service.assign(routeId, dto)).resolves.toMatchObject({ estado: 'ASIGNADA' });
    expect(tx.ruta.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ruta_id: routeId, conductor_id: null, estado: 'GENERADA' },
      data: expect.objectContaining({ conductor_id: driverId, estado: 'ASIGNADA' }),
    }));
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable', timeout: 15000, maxWait: 3000 });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.vehiculo.findUnique).toHaveBeenCalledWith({ where: { vehiculo_id: vehicleId }, select: { estado: true } });
    expect(tx.rutaVersion.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { vehiculo_id: vehicleId, ruta: otherActive } }));
    expect(tx.paradaRuta.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { pedido_id: { in: [orderId] }, ruta_version: { ruta: otherActive } } }));
    const [resources, update] = [tx.paradaRuta.findMany.mock.invocationCallOrder[0], tx.ruta.updateMany.mock.invocationCallOrder[0]];
    expect(resources).toBeLessThan(update);
  });

  it('rechaza ruta inexistente o ya asignada', async () => {
    tx.ruta.findUnique.mockResolvedValueOnce(null);
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(NotFoundException);
    tx.ruta.findUnique.mockResolvedValueOnce({ ...route, estado: 'ASIGNADA', conductor_id: driverId });
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza ruta EN_CURSO y ruta GENERADA con conductor', async () => {
    tx.ruta.findUnique.mockResolvedValueOnce({ ...route, estado: 'EN_CURSO', conductor_id: driverId });
    await expectRejected('La ruta ya fue asignada o cambió de estado');
    tx.ruta.findUnique.mockResolvedValueOnce({ ...route, conductor_id: driverId });
    await expectRejected('La ruta ya fue asignada o cambió de estado');
  });

  it.each([
    ['no confirmable', { resultado: { confirmable: false, inicio: snapshot.inicio, end: snapshot.fin } }],
    ['sin jornada', { resultado: { confirmable: true } }],
  ])('rechaza ruta %s', async (_, patch) => {
    tx.ruta.findUnique.mockResolvedValueOnce(withVersion(patch));
    await expectRejected('Solo se puede asignar una ruta confirmable con jornada calculada.');
  });

  it('rechaza conductor ajeno a candidatos, inactivo, sin cuenta o sin disponibilidad', async () => {
    tx.ruta.findUnique.mockResolvedValueOnce({ ...route, alternativa: { ejecucion: { version: { snapshot: { ...snapshot, drivers: [] } } } } });
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
    tx.conductor.findMany.mockResolvedValueOnce([{ ...activeDriver, estado: 'INACTIVO', usuario: null, disponibilidades: [] }]);
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
    tx.conductor.findMany.mockResolvedValueOnce([{ ...activeDriver, disponibilidades: [] }]);
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza conductor inexistente con 404', async () => {
    tx.conductor.findMany.mockResolvedValueOnce([]);
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.ruta.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['conductor inactivo', { estado: 'INACTIVO' }, 'El conductor no está activo.'],
    ['usuario null', { usuario: null }, 'El conductor no tiene una cuenta activa.'],
    ['cuenta inactiva', { usuario: { estado: 'INACTIVO', rol: { nombre: 'Usuario Final / Conductor' } } }, 'El conductor no tiene una cuenta activa.'],
    ['rol incorrecto', { usuario: { estado: 'ACTIVO', rol: { nombre: 'Operador / Técnico' } } }, 'La cuenta del conductor no tiene rol Conductor.'],
    ['disponibilidad insuficiente', { disponibilidades: [] }, 'El conductor no tiene disponibilidad para toda la jornada calculada.'],
  ])('rechaza %s con su causa', async (_, patch, message) => {
    tx.conductor.findMany.mockResolvedValueOnce([{ ...activeDriver, ...patch }]);
    await expectRejected(message);
  });

  it('consulta disponibilidad para toda la jornada y ocupación excluyendo la ruta actual', async () => {
    await service.assign(routeId, dto);
    expect(tx.conductor.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { conductor_id: { in: [driverId] } } }));
    const select = tx.conductor.findMany.mock.calls[0][0].select;
    expect(select.disponibilidades.where).toEqual({ estado: 'DISPONIBLE', inicio: { lte: new Date(snapshot.inicio) }, fin: { gte: new Date(snapshot.fin) } });
    expect(tx.ruta.findMany).toHaveBeenCalledWith({ where: { conductor_id: { in: [driverId] }, estado: { in: ['ASIGNADA', 'EN_CURSO'] }, ruta_id: { not: routeId } }, select: { conductor_id: true } });
  });

  it('rechaza doble ocupacion y conflicto concurrente', async () => {
    tx.ruta.findMany.mockResolvedValueOnce([{ conductor_id: driverId }]);
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
    tx.ruta.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.assign(routeId, dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([null, { estado: 'MANTENIMIENTO' }])('rechaza vehículo no DISPONIBLE (%j)', async vehicle => {
    tx.vehiculo.findUnique.mockResolvedValueOnce(vehicle);
    await expectRejected('El vehículo de la ruta no está disponible.');
  });

  it('rechaza vehículo usado por la versión actual de otra ruta activa e ignora versiones históricas', async () => {
    tx.rutaVersion.findMany.mockResolvedValueOnce([{ numero: 1, ruta: { current_version: 2 } }]);
    await expect(service.assign(routeId, dto)).resolves.toMatchObject({ estado: 'ASIGNADA' });
    tx.ruta.updateMany.mockClear();
    tx.rutaVersion.findMany.mockResolvedValueOnce([{ numero: 1, ruta: { current_version: 1 } }]);
    await expectRejected('El vehículo ya está asignado a otra ruta activa.');
  });

  it('rechaza pedido incluido en la versión actual de otra ruta activa', async () => {
    tx.paradaRuta.findMany.mockResolvedValueOnce([{ ruta_version: { numero: 1, ruta: { current_version: 1 } } }]);
    await expectRejected('Uno o más pedidos de la ruta ya pertenecen a otra ruta activa.');
  });

  it('carrera de doble asignación: solo una solicitud cambia la ruta', async () => {
    tx.ruta.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const results = await Promise.allSettled([service.assign(routeId, dto), service.assign(routeId, dto)]);
    expect(results.map(result => result.status).sort((a, b) => a.localeCompare(b))).toEqual(['fulfilled', 'rejected']);
    expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: expect.any(ConflictException) });
  });
});

describe('candidatos de asignación', () => {
  const ids = ['d-ok', 'd-inactivo', 'd-sin-cuenta', 'd-cuenta-inactiva', 'd-rol', 'd-sin-disponibilidad', 'd-ocupado'];
  const candidateRoute = { ...route, alternativa: { ejecucion: { version: { snapshot: { ...snapshot, drivers: ids.map(conductor_id => ({ conductor_id })) } } } } };
  const sensitive = { dni: '12345678', telefono: '999888777', licencia_categoria: 'A-IIb', email: 'privado@example.test' };
  const rows = [
    { ...activeDriver, ...sensitive, conductor_id: 'd-ok', nombre_completo: 'Ana Elegible' },
    { ...activeDriver, conductor_id: 'd-inactivo', estado: 'INACTIVO' },
    { ...activeDriver, conductor_id: 'd-sin-cuenta', usuario: null },
    { ...activeDriver, conductor_id: 'd-cuenta-inactiva', usuario: { estado: 'INACTIVO', rol: { nombre: 'Usuario Final / Conductor' } } },
    { ...activeDriver, conductor_id: 'd-rol', usuario: { estado: 'ACTIVO', rol: { nombre: 'Administrador' } } },
    { ...activeDriver, conductor_id: 'd-sin-disponibilidad', disponibilidades: [] },
    { ...activeDriver, conductor_id: 'd-ocupado' },
  ];

  it('limita la consulta a los conductores del snapshot sin pedir datos sensibles', async () => {
    tx.ruta.findUnique.mockResolvedValueOnce(candidateRoute);
    tx.conductor.findMany.mockResolvedValueOnce(rows);
    await service.candidates(routeId);
    const query = tx.conductor.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ conductor_id: { in: ids } });
    expect(Object.keys(query.select)).toEqual(['conductor_id', 'nombre_completo', 'estado', 'usuario', 'disponibilidades']);
    expect(query.select.usuario).toEqual({ select: { estado: true, rol: { select: { nombre: true } } } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.ruta.updateMany).not.toHaveBeenCalled();
  });

  it('devuelve solo conductores elegibles y solo dos campos', async () => {
    tx.ruta.findUnique.mockResolvedValueOnce(candidateRoute);
    tx.conductor.findMany.mockResolvedValueOnce(rows);
    tx.ruta.findMany.mockResolvedValueOnce([{ conductor_id: 'd-ocupado' }]);
    const result = await service.candidates(routeId);
    expect(result).toEqual([{ conductor_id: 'd-ok', nombre_completo: 'Ana Elegible' }]);
    expect(Object.keys(result[0])).toEqual(['conductor_id', 'nombre_completo']);
    const json = JSON.stringify(result);
    for (const value of Object.values(sensitive)) expect(json).not.toContain(value);
    expect(json).not.toContain('motivo');
  });

  it('responde lista vacía si ningún candidato es elegible', async () => {
    tx.conductor.findMany.mockResolvedValueOnce([{ ...activeDriver, disponibilidades: [] }]);
    await expect(service.candidates(routeId)).resolves.toEqual([]);
  });

  it.each([
    ['ASIGNADA', { ...route, estado: 'ASIGNADA', conductor_id: driverId }],
    ['EN_CURSO', { ...route, estado: 'EN_CURSO', conductor_id: driverId }],
    ['COMPLETADA', { ...route, estado: 'COMPLETADA', conductor_id: driverId }],
    ['GENERADA con conductor', { ...route, conductor_id: driverId }],
    ['no confirmable', withVersion({ resultado: { confirmable: false, inicio: snapshot.inicio, end: snapshot.fin } })],
  ])('responde 409 para ruta %s sin consultar conductores', async (_, value) => {
    tx.ruta.findUnique.mockResolvedValueOnce(value);
    await expect(service.candidates(routeId)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.conductor.findMany).not.toHaveBeenCalled();
  });

  it('responde 409 si el vehículo o los pedidos ya están comprometidos y 404 si la ruta no existe', async () => {
    tx.vehiculo.findUnique.mockResolvedValueOnce({ estado: 'MANTENIMIENTO' });
    await expect(service.candidates(routeId)).rejects.toBeInstanceOf(ConflictException);
    tx.paradaRuta.findMany.mockResolvedValueOnce([{ ruta_version: { numero: 1, ruta: { current_version: 1 } } }]);
    await expect(service.candidates(routeId)).rejects.toBeInstanceOf(ConflictException);
    tx.ruta.findUnique.mockResolvedValueOnce(null);
    await expect(service.candidates(routeId)).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.conductor.findMany).not.toHaveBeenCalled();
  });
});
