import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { IndicatorsQueryDto } from './dto/indicators-query.dto';
import { computeIndicators, indicatorsPeriod, IndicatorsService } from './indicators.service';

const decimal = (value: number) => new Prisma.Decimal(value);
const stop = (estado_entrega: string, tipos: string[] = []) => ({ estado_entrega, incidencias: tipos.map(tipo => ({ tipo })) });
const record = (distancia: number, litros: number, co2: number, costo: number | null, origen: string) => ({
  distancia_km: decimal(distancia), combustible_l: decimal(litros), emisiones_co2_kg: decimal(co2), costo_combustible: costo === null ? null : decimal(costo), origen_datos: origen,
});
const route = (paradas: ReturnType<typeof stop>[], sostenibilidad: ReturnType<typeof record> | null = null, minutes: number | null = 60) => ({
  ruta_id: 'r', iniciado_en: minutes === null ? null : new Date('2030-01-01T13:00:00Z'), finalizado_en: new Date(Date.parse('2030-01-01T13:00:00Z') + (minutes ?? 0) * 60000),
  versiones: [{ paradas }], sostenibilidad,
});
type Routes = Parameters<typeof computeIndicators>[0];

describe('US-022 indicadores: cálculo', () => {
  it('escenario 1: calcula entregas, tasa de éxito, incidencias por tipo y duración media', () => {
    const value = computeIndicators([
      route([stop('ENTREGADA'), stop('NO_ENTREGADA', ['CLIENTE_AUSENTE']), stop('ENTREGADA', ['VIA_BLOQUEADA', 'CLIENTE_AUSENTE'])], null, 60),
      route([stop('ENTREGADA'), stop('PENDIENTE')], null, 90),
    ] as unknown as Routes);
    expect(value.datos_suficientes).toBe(true);
    expect(value.operacion).toEqual({
      rutas_completadas: 2,
      entregas: { realizadas: 3, no_realizadas: 1, pendientes: 1, tasa_exito: 75 },
      incidencias: { total: 3, por_tipo: { CLIENTE_AUSENTE: 2, DIRECCION_INCORRECTA: 0, ACCESO_RESTRINGIDO: 0, VIA_BLOQUEADA: 1, VEHICULO_AVERIADO: 0, CARGA_DANADA: 0, OTRO: 0 } },
      duracion_media_min: 75,
    });
  });

  it('suma la sostenibilidad registrada y calcula CO₂ por entrega solo con las rutas que tienen registro', () => {
    const value = computeIndicators([
      route([stop('ENTREGADA'), stop('ENTREGADA')], record(10.5, 1.05, 2.1, 12.5, 'ESTIMADO')),
      route([stop('ENTREGADA'), stop('NO_ENTREGADA')], record(4.25, 0.5, 0.85, null, 'MEDIDO')),
      route([stop('ENTREGADA'), stop('ENTREGADA'), stop('ENTREGADA')]),
    ] as unknown as Routes);
    expect(value.sostenibilidad).toEqual({
      rutas_con_registro: 2, cobertura: 66.67,
      distancia_km: 14.75, combustible_l: 1.55, co2_kg: 2.95, co2_por_entrega_kg: 0.9833,
      costo_combustible: 12.5, registros_con_costo: 1,
      origen: { ESTIMADO: 1, MEDIDO: 1 },
    });
  });

  it('ruta infeliz: sin rutas completadas no hay datos suficientes y los indicadores son null, no 0', () => {
    const value = computeIndicators([]);
    expect(value.datos_suficientes).toBe(false);
    expect(value.operacion.entregas.tasa_exito).toBeNull();
    expect(value.operacion.duracion_media_min).toBeNull();
    expect(value.sostenibilidad).toMatchObject({ cobertura: null, distancia_km: null, combustible_l: null, co2_kg: null, co2_por_entrega_kg: null, costo_combustible: null });
  });

  it('marca como insuficientes los indicadores que no se pueden calcular aunque haya rutas', () => {
    const value = computeIndicators([
      route([stop('NO_ENTREGADA')], record(3, 0.3, 0.6, null, 'ESTIMADO'), null),
      { ...route([]), versiones: [] },
    ] as unknown as Routes);
    expect(value.datos_suficientes).toBe(true);
    expect(value.operacion.entregas.tasa_exito).toBe(0);
    expect(value.operacion.duracion_media_min).toBe(60);
    expect(value.sostenibilidad.co2_por_entrega_kg).toBeNull();
    expect(value.sostenibilidad.costo_combustible).toBeNull();
    expect(computeIndicators([route([stop('PENDIENTE')], null, null)] as unknown as Routes).operacion).toMatchObject({ entregas: { tasa_exito: null }, duracion_media_min: null });
  });

  it('ignora tipos de incidencia u orígenes fuera del catálogo y duraciones incoherentes', () => {
    const odd = { ...route([stop('ENTREGADA', ['DESCONOCIDO'])], record(1, 0, 0, null, 'OTRO')), finalizado_en: new Date('2029-12-31T00:00:00Z') };
    const value = computeIndicators([odd] as unknown as Routes);
    expect(value.operacion.incidencias.total).toBe(0);
    expect(value.operacion.duracion_media_min).toBeNull();
    expect(value.sostenibilidad.origen).toEqual({ ESTIMADO: 0, MEDIDO: 0 });
  });
});

describe('US-022 indicadores: periodo', () => {
  const now = new Date('2030-03-15T03:00:00Z'); // 2030-03-14 22:00 en Lima

  it('por defecto usa los últimos 30 días hasta hoy en America/Lima', () => {
    const period = indicatorsPeriod({}, now);
    expect(period).toMatchObject({ desde: '2030-02-13', hasta: '2030-03-14' });
    expect(period.from.toISOString()).toBe('2030-02-13T05:00:00.000Z');
    expect(period.to.toISOString()).toBe('2030-03-15T05:00:00.000Z');
  });

  it('escenario 2: respeta el periodo elegido y con solo «hasta» toma los 30 días anteriores', () => {
    expect(indicatorsPeriod({ desde: '2030-01-01', hasta: '2030-01-31' }, now)).toMatchObject({ desde: '2030-01-01', hasta: '2030-01-31' });
    expect(indicatorsPeriod({ hasta: '2030-01-31' }, now)).toMatchObject({ desde: '2030-01-02', hasta: '2030-01-31' });
    expect(indicatorsPeriod({ desde: '2030-03-14', hasta: '2030-03-14' }, now).to.toISOString()).toBe('2030-03-15T05:00:00.000Z');
  });

  it.each([
    [{ desde: '2030-02-01', hasta: '2030-01-01' }, '«desde» es posterior a «hasta»'],
    [{ desde: '2029-01-01', hasta: '2030-01-02' }, 'no puede superar 366 días'],
    [{ desde: '2030-02-30' }, 'desde: la fecha no existe.'],
    [{ hasta: '2030-02-30' }, 'hasta: la fecha no existe.'],
  ])('rechaza el periodo %j', (query, message) => {
    expect(() => indicatorsPeriod(query, now)).toThrow(BadRequestException);
    expect(() => indicatorsPeriod(query, now)).toThrow(message);
  });

  it('valida el formato AAAA-MM-DD', async () => {
    const errors = await validate(plainToInstance(IndicatorsQueryDto, { desde: '2030/01/01', hasta: '01-02-2030' }));
    expect(errors.flatMap(error => Object.values(error.constraints ?? {}))).toEqual(['desde debe tener el formato AAAA-MM-DD.', 'hasta debe tener el formato AAAA-MM-DD.']);
    expect(await validate(plainToInstance(IndicatorsQueryDto, { desde: '2030-01-01', hasta: '2030-01-31' }))).toEqual([]);
  });
});

describe('US-022 indicadores: consulta', () => {
  it('consulta solo rutas COMPLETADA terminadas dentro del periodo y devuelve el periodo aplicado', async () => {
    const prisma = { ruta: { findMany: jest.fn().mockResolvedValue([]) } };
    const value = await new IndicatorsService(prisma as unknown as PrismaService).indicators({ desde: '2030-01-01', hasta: '2030-01-31' });
    expect(prisma.ruta.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { estado: 'COMPLETADA', finalizado_en: { gte: new Date('2030-01-01T05:00:00Z'), lt: new Date('2030-02-01T05:00:00Z') } },
    }));
    expect(value).toMatchObject({ periodo: { desde: '2030-01-01', hasta: '2030-01-31' }, datos_suficientes: false });
  });
});
