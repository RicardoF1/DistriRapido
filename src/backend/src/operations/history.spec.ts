import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryService } from './history.service';

const planning = { alternativa: { ejecucion: { version: { numero: 2, planificacion: { planificacion_id: 'p1', etiqueta: 'Plan norte' } } } } };
const row = {
  ruta_id: 'r1', iniciado_en: new Date('2031-06-10T13:00:00Z'), finalizado_en: new Date('2031-06-10T14:00:00Z'), ...planning,
  conductor: { conductor_id: 'd1', nombre_completo: 'Ana' }, sostenibilidad: { registro_id: 's1' },
  versiones: [{ numero: 1, vehiculo: { vehiculo_id: 'v1', placa: 'ABC-123' }, paradas: [
    { estado_entrega: 'ENTREGADA', _count: { incidencias: 1 } }, { estado_entrega: 'NO_ENTREGADA', _count: { incidencias: 2 } }, { estado_entrega: 'ENTREGADA', _count: { incidencias: 0 } },
  ] }],
};
const detailRow = {
  ruta_id: 'r1', estado: 'COMPLETADA', creado_en: new Date('2031-06-09T12:00:00Z'), confirmado_en: new Date('2031-06-09T15:00:00Z'), version_confirmada: 1,
  asignado_en: new Date('2031-06-09T16:00:00Z'), iniciado_en: row.iniciado_en, finalizado_en: row.finalizado_en, current_version: 1, ...planning,
  confirmador: { email: 'planificador@example.test' }, conductor: row.conductor, sostenibilidad: null,
  versiones: [{ numero: 1, distancia_m: '1000', duracion_s: '600', vehiculo: { vehiculo_id: 'v1', placa: 'ABC-123', tipo: 'VAN' }, paradas: [
    { parada_id: 'p1', pedido_id: 'o1', secuencia: 1, datos: { direccion: 'Jr. Real 100' }, estado_entrega: 'NO_ENTREGADA', causa_no_entrega: 'Cliente ausente', atendido_en: row.finalizado_en, incidencias: [{ incidencia_id: 'i1' }] },
    { parada_id: 'p2', pedido_id: 'o2', secuencia: 2, datos: null, estado_entrega: 'ENTREGADA', causa_no_entrega: null, atendido_en: row.finalizado_en, incidencias: [] },
  ] }],
};

function setup() {
  const prisma = {
    ruta: { findMany: jest.fn().mockResolvedValue([row]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockResolvedValue(detailRow) },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    $queryRaw: jest.fn().mockResolvedValue([{ ruta_id: 'r1' }]),
  };
  return { prisma, service: new HistoryService(prisma as unknown as PrismaService) };
}

describe('US-023 historial: listado', () => {
  it('escenario 1: lista solo rutas COMPLETADA, de la más reciente a la más antigua, con su resumen', async () => {
    const { prisma, service } = setup();
    const page = await service.list(Object.assign(new HistoryQueryDto(), {}));
    expect(prisma.ruta.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { estado: 'COMPLETADA' }, orderBy: [{ finalizado_en: 'desc' }, { ruta_id: 'asc' }], skip: 0, take: 12 }));
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(page).toEqual({
      items: [{
        ruta_id: 'r1', iniciado_en: row.iniciado_en, finalizado_en: row.finalizado_en,
        planificacion: { planificacion_id: 'p1', etiqueta: 'Plan norte' },
        conductor: row.conductor, vehiculo: { vehiculo_id: 'v1', placa: 'ABC-123' },
        entregas: { total: 3, realizadas: 2, no_realizadas: 1 }, incidencias: 3, con_sostenibilidad: true,
      }],
      total: 1, page: 1, pageSize: 12,
    });
  });

  it('aplica el periodo de finalización en Lima, la búsqueda y la página', async () => {
    const { prisma, service } = setup();
    await service.list(Object.assign(new HistoryQueryDto(), { desde: '2031-06-01', hasta: '2031-06-30', search: 'abc', page: 3, pageSize: 5 }));
    const args = prisma.ruta.findMany.mock.calls[0][0];
    expect(args.where.finalizado_en).toEqual({ gte: new Date('2031-06-01T05:00:00Z'), lt: new Date('2031-07-01T05:00:00Z') });
    expect(args.where.OR).toHaveLength(2);
    expect(args).toMatchObject({ skip: 10, take: 5 });
  });

  it.each([
    [{ con_incidencias: 'true' }, [undefined, true]],
    [{ con_no_entregas: 'true' }, ['NO_ENTREGADA', false]],
    [{ con_incidencias: 'true', con_no_entregas: 'true' }, ['NO_ENTREGADA', true]],
  ])('filtra por la versión vigente con %j', async (filters, [state, incidents]) => {
    const { prisma, service } = setup();
    await service.list(Object.assign(new HistoryQueryDto(), filters));
    const values = prisma.$queryRaw.mock.calls[0].slice(1);
    expect(values).toEqual([state ?? null, state ?? null, incidents]);
    expect(prisma.ruta.findMany.mock.calls[0][0].where.ruta_id).toEqual({ in: ['r1'] });
  });

  it('ignora con_*=false y acepta solo «desde» o solo «hasta»', async () => {
    const { prisma, service } = setup();
    await service.list(Object.assign(new HistoryQueryDto(), { con_incidencias: 'false', con_no_entregas: 'false', desde: '2031-06-01' }));
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.ruta.findMany.mock.calls[0][0].where.finalizado_en).toEqual({ gte: new Date('2031-06-01T05:00:00Z') });
    await service.list(Object.assign(new HistoryQueryDto(), { hasta: '2031-06-01' }));
    expect(prisma.ruta.findMany.mock.calls[1][0].where.finalizado_en).toEqual({ lt: new Date('2031-06-02T05:00:00Z') });
  });

  it('responde vehículo null y contadores en cero si la ruta no tiene versión', async () => {
    const { prisma, service } = setup();
    prisma.ruta.findMany.mockResolvedValueOnce([{ ...row, versiones: [], sostenibilidad: null }]);
    const [item] = (await service.list(new HistoryQueryDto())).items;
    expect(item).toMatchObject({ vehiculo: null, entregas: { total: 0, realizadas: 0, no_realizadas: 0 }, incidencias: 0, con_sostenibilidad: false });
  });

  it.each([
    [{ desde: '2031-06-30', hasta: '2031-06-01' }, '«desde» es posterior a «hasta»'],
    [{ desde: '2031-02-30' }, 'desde: la fecha no existe.'],
  ])('rechaza el periodo %j', async (filters, message) => {
    const { prisma, service } = setup();
    await expect(service.list(Object.assign(new HistoryQueryDto(), filters))).rejects.toThrow(BadRequestException);
    await expect(service.list(Object.assign(new HistoryQueryDto(), filters))).rejects.toThrow(message);
    expect(prisma.ruta.findMany).not.toHaveBeenCalled();
  });

  it('valida formato de fechas, booleanos y tamaño de página', async () => {
    const errors = await validate(plainToInstance(HistoryQueryDto, { desde: '2031/06/01', con_incidencias: 'si', con_no_entregas: '1', pageSize: '60' }));
    expect(errors.flatMap(error => Object.values(error.constraints ?? {}))).toEqual(expect.arrayContaining([
      'desde debe tener el formato AAAA-MM-DD.', 'con_incidencias debe ser true o false.', 'con_no_entregas debe ser true o false.', 'pageSize debe estar entre 1 y 50.',
    ]));
    expect(plainToInstance(HistoryQueryDto, { search: '   ' }).search).toBeUndefined();
  });
});

describe('US-023 historial: detalle', () => {
  it('reúne la trazabilidad: planificación, confirmación, ejecución, entregas e incidencias', async () => {
    const { prisma, service } = setup();
    const value = await service.detail('r1');
    expect(prisma.ruta.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { ruta_id: 'r1', estado: 'COMPLETADA' } }));
    expect(value).toMatchObject({
      ruta_id: 'r1', confirmado_por: 'planificador@example.test', version_confirmada: 1,
      planificacion: { planificacion_id: 'p1', etiqueta: 'Plan norte', version: 2 },
      version: { numero: 1, vehiculo: { placa: 'ABC-123' } },
      entregas: { total: 2, realizadas: 1, no_realizadas: 1 }, incidencias: 1, sostenibilidad: null,
    });
    expect(value.paradas.map(stop => stop.direccion)).toEqual(['Jr. Real 100', null]);
    expect(value).not.toHaveProperty('alternativa');
    expect(value).not.toHaveProperty('confirmador');
    expect(value.paradas[0]).not.toHaveProperty('datos');
  });

  it('responde confirmado_por null en rutas anteriores a US-020', async () => {
    const { prisma, service } = setup();
    prisma.ruta.findFirst.mockResolvedValueOnce({ ...detailRow, confirmador: null, confirmado_en: null, version_confirmada: null });
    expect((await service.detail('r1')).confirmado_por).toBeNull();
  });

  it('responde 404 si la ruta no existe, no ha terminado o no tiene versión', async () => {
    const { prisma, service } = setup();
    prisma.ruta.findFirst.mockResolvedValueOnce(null);
    await expect(service.detail('x')).rejects.toThrow(NotFoundException);
    prisma.ruta.findFirst.mockResolvedValueOnce({ ...detailRow, versiones: [] });
    await expect(service.detail('x')).rejects.toThrow('La operación no existe o todavía no ha terminado.');
  });
});
