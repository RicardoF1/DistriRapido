import { BadRequestException, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../roles/roles';
import { OperationsQueryDto } from './dto/operations-query.dto';
import { OperationsGuard } from './operations.guard';
import { OperationsService } from './operations.service';

const prisma = {
  ruta: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn(), findFirst: jest.fn() },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};
let service: OperationsService;
const route = (stops: { estado_entrega: string; incidents?: number }[]) => ({
  ruta_id: 'r1', estado: 'EN_CURSO', asignado_en: new Date(), iniciado_en: new Date(), finalizado_en: null, current_version: 1,
  conductor: { conductor_id: 'd1', nombre_completo: 'Conductor' },
  versiones: [{ numero: 1, distancia_m: '1000', duracion_s: '60', vehiculo: { vehiculo_id: 'v', placa: 'ABC-123', tipo: 'VAN' }, paradas: stops.map(stop => ({ estado_entrega: stop.estado_entrega, _count: { incidencias: stop.incidents ?? 0 } })) }],
});

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((operations: unknown[]) => Promise.all(operations));
  prisma.ruta.findMany.mockResolvedValue([]);
  prisma.ruta.count.mockResolvedValue(0);
  prisma.$queryRaw.mockResolvedValue([]);
  service = new OperationsService(prisma as unknown as PrismaService);
});

describe('US-019: permisos del seguimiento operativo', () => {
  const context = (nombre?: string) => ({ switchToHttp: () => ({ getRequest: () => ({ user: nombre ? { rol: { nombre } } : undefined }) }) }) as unknown as ExecutionContext;
  it.each([ROLE_NAMES.administrator, ROLE_NAMES.operator])('permite %s', role => {
    expect(new OperationsGuard().canActivate(context(role))).toBe(true);
  });
  it.each([ROLE_NAMES.driver, ROLE_NAMES.auditor, undefined])('deniega %s', role => {
    expect(() => new OperationsGuard().canActivate(context(role))).toThrow(ForbiddenException);
  });
});

describe('US-019: filtros permitidos', () => {
  const errors = async (data: Record<string, unknown>) => validate(plainToInstance(OperationsQueryDto, data), { whitelist: true, forbidNonWhitelisted: true });
  it('acepta filtros válidos y normaliza la búsqueda', async () => {
    const dto = plainToInstance(OperationsQueryDto, { estado: 'EN_CURSO', estado_entrega: 'NO_ENTREGADA', conductor_id: '00000000-0000-4000-8000-000000000001', desde: '2026-11-01', hasta: '2026-11-09', con_incidencias: 'true', search: '  ABC  ', page: '2', pageSize: '20' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ search: 'ABC', page: 2, pageSize: 20 });
  });
  it.each([
    { estado: 'GENERADA' }, { estado_entrega: 'PERDIDA' }, { conductor_id: 'x' }, { desde: '09/11/2026' }, { hasta: '2026-13-01' },
    { con_incidencias: 'si' }, { pageSize: 51 }, { page: 0 }, { search: 'a'.repeat(101) }, { orden: 'asc' },
  ])('rechaza %j', async data => {
    expect((await errors(data)).length).toBeGreaterThan(0);
  });
});

describe('US-019: consulta de rutas en operación', () => {
  it('solo consulta rutas en operación y calcula el progreso de la versión vigente', async () => {
    prisma.ruta.findMany.mockResolvedValue([route([{ estado_entrega: 'ENTREGADA', incidents: 2 }, { estado_entrega: 'NO_ENTREGADA' }, { estado_entrega: 'PENDIENTE', incidents: 1 }])]);
    prisma.ruta.count.mockResolvedValue(1);
    const result = await service.list(plainToInstance(OperationsQueryDto, {}));
    expect(prisma.ruta.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { estado: { in: ['ASIGNADA', 'EN_CURSO', 'COMPLETADA'] } }, skip: 0, take: 12 }));
    expect(result.items[0]).toMatchObject({ deliveries: { total: 3, delivered: 1, not_delivered: 1, pending: 1, processed: 2, percentage: 66.67 }, incidents: 3, version: { vehiculo: { placa: 'ABC-123' } } });
    expect(result.items[0]).not.toHaveProperty('versiones');
    expect(result).toMatchObject({ total: 1, page: 1, pageSize: 12 });
  });

  it('aplica estado, conductor, búsqueda y fechas en America/Lima', async () => {
    await service.list(plainToInstance(OperationsQueryDto, { estado: 'COMPLETADA', conductor_id: '00000000-0000-4000-8000-000000000001', search: 'abc', desde: '2026-11-01', hasta: '2026-11-01', page: 3, pageSize: 5 }));
    const args = prisma.ruta.findMany.mock.calls[0][0];
    expect(args.where).toMatchObject({ estado: 'COMPLETADA', conductor_id: '00000000-0000-4000-8000-000000000001', asignado_en: { gte: new Date('2026-11-01T05:00:00.000Z'), lt: new Date('2026-11-02T05:00:00.000Z') } });
    expect(args.where.OR).toHaveLength(2);
    expect(args).toMatchObject({ skip: 10, take: 5 });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('filtra por estado de entrega e incidencias sobre la versión vigente', async () => {
    prisma.$queryRaw.mockResolvedValue([{ ruta_id: 'r1' }]);
    await service.list(plainToInstance(OperationsQueryDto, { estado_entrega: 'NO_ENTREGADA', con_incidencias: 'true' }));
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.ruta.findMany.mock.calls[0][0].where.ruta_id).toEqual({ in: ['r1'] });
  });

  it('devuelve una lista vacía cuando nada coincide', async () => {
    const result = await service.list(plainToInstance(OperationsQueryDto, { con_incidencias: 'true' }));
    expect(prisma.ruta.findMany.mock.calls[0][0].where.ruta_id).toEqual({ in: [] });
    expect(result).toMatchObject({ items: [], total: 0 });
  });

  it.each([
    [{ desde: '2026-02-30' }, 'desde: la fecha no existe.'],
    [{ desde: '2026-11-09', hasta: '2026-11-01' }, 'El rango de fechas no es válido: «desde» es posterior a «hasta».'],
  ])('rechaza fechas inválidas %j', async (data, message) => {
    await expect(service.list(plainToInstance(OperationsQueryDto, data))).rejects.toThrow(new BadRequestException(message));
    expect(prisma.ruta.findMany).not.toHaveBeenCalled();
  });
});

describe('US-019: resumen y detalle', () => {
  it('resume rutas, entregas e incidencias completando estados ausentes con cero', async () => {
    prisma.ruta.groupBy.mockResolvedValue([{ estado: 'EN_CURSO', _count: { _all: 2 } }]);
    prisma.$queryRaw.mockResolvedValueOnce([{ estado_entrega: 'ENTREGADA', total: 5n }, { estado_entrega: 'PENDIENTE', total: 1n }]).mockResolvedValueOnce([{ total: 3n }]);
    expect(await service.summary()).toEqual({
      routes: { ASIGNADA: 0, EN_CURSO: 2, COMPLETADA: 0 },
      deliveries: { PENDIENTE: 1, ENTREGADA: 5, NO_ENTREGADA: 0 },
      incidents: 3,
    });
  });

  it('muestra entregas con causa, incidencias y estado del pedido', async () => {
    prisma.ruta.findFirst.mockResolvedValue({
      ...route([]), versiones: [{ numero: 1, distancia_m: '1', duracion_s: '1', vehiculo: { vehiculo_id: 'v', placa: 'ABC-123', tipo: 'VAN' }, paradas: [
        { parada_id: 'p1', pedido_id: 'o1', secuencia: 1, datos: { direccion: 'Jr. Real 100' }, estado_entrega: 'NO_ENTREGADA', causa_no_entrega: 'Cliente ausente', atendido_en: new Date(), pedido: { estado: 'EN_RUTA' }, incidencias: [{ incidencia_id: 'i1', tipo: 'CLIENTE_AUSENTE' }] },
        { parada_id: 'p2', pedido_id: 'o2', secuencia: 2, datos: {}, estado_entrega: 'PENDIENTE', causa_no_entrega: null, atendido_en: null, pedido: { estado: 'EN_RUTA' }, incidencias: [] },
      ] }],
    });
    const result = await service.detail('r1');
    expect(prisma.ruta.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { ruta_id: 'r1', estado: { in: ['ASIGNADA', 'EN_CURSO', 'COMPLETADA'] } } }));
    expect(result.stops[0]).toMatchObject({ direccion: 'Jr. Real 100', causa_no_entrega: 'Cliente ausente', pedido_estado: 'EN_RUTA', incidencias: [{ tipo: 'CLIENTE_AUSENTE' }] });
    expect(result.stops[1].direccion).toBeNull();
    expect(result.stops[0]).not.toHaveProperty('datos');
    expect(result).toMatchObject({ deliveries: { total: 2, not_delivered: 1, pending: 1 }, incidents: 1 });
  });

  it('responde 404 para rutas inexistentes o fuera de operación', async () => {
    prisma.ruta.findFirst.mockResolvedValue(null);
    await expect(service.detail('r1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
