import 'reflect-metadata';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSustainabilityDto } from './dto/register-sustainability.dto';
import { estimatedEmissions, missingSustainabilityFields, RouteSustainabilityService } from './route-sustainability.service';

const routeId = '00000000-0000-4000-8000-000000000021';
const actorId = '00000000-0000-4000-8000-000000000022';
const vehicleId = '00000000-0000-4000-8000-000000000023';
const complete: RegisterSustainabilityDto = { distancia_km: 12.5, combustible_l: 1.25, factor_emision_kg_co2_km: 0.21, origen_datos: 'ESTIMADO' };
const route = { estado: 'CONFIRMADA', sostenibilidad: null, versiones: [{ numero: 2, vehiculo_id: vehicleId }] };
const tx = { $queryRaw: jest.fn(), ruta: { findUnique: jest.fn() }, registroSostenibilidad: { create: jest.fn() } };
const prisma = { $transaction: jest.fn() };
let service: RouteSustainabilityService;

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((operation: (db: typeof tx) => unknown) => operation(tx));
  tx.ruta.findUnique.mockResolvedValue(route);
  tx.registroSostenibilidad.create.mockImplementation(({ data }: { data: object }) => Promise.resolve({ registro_id: 'reg', ...data }));
  service = new RouteSustainabilityService(prisma as unknown as PrismaService);
});

const errorBody = async (dto: RegisterSustainabilityDto) => {
  const failure = await service.register(routeId, dto, actorId).catch((cause: unknown) => cause);
  expect(failure).toBeInstanceOf(BadRequestException);
  return (failure as BadRequestException).getResponse() as { message: string; code: string; campos_requeridos: string[] };
};

describe('US-021 registrar información de sostenibilidad', () => {
  it('escenario 1: almacena la información asociada a la ruta, su versión actual, su vehículo y quién la registró', async () => {
    const saved = await service.register(routeId, { ...complete, costo_combustible: 18.9, observaciones: '  Medición del tablero  ' }, actorId);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.registroSostenibilidad.create).toHaveBeenCalledWith({
      data: {
        ruta_id: routeId, ruta_version: 2, vehiculo_id: vehicleId,
        distancia_km: 12.5, combustible_l: 1.25, factor_emision_kg_co2_km: 0.21, emisiones_co2_kg: new Prisma.Decimal('2.625'),
        origen_datos: 'ESTIMADO', costo_combustible: 18.9, observaciones: 'Medición del tablero', registrado_por: actorId,
      },
      select: expect.objectContaining({ registro_id: true, emisiones_co2_kg: true, registrador: { select: { email: true } } }),
    });
    expect(saved).toMatchObject({ registro_id: 'reg', ruta_id: routeId });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable', timeout: 15000, maxWait: 3000 });
  });

  it('guarda costo y observaciones como nulos cuando no se informan o vienen en blanco', async () => {
    await service.register(routeId, { ...complete, observaciones: '   ' }, actorId);
    expect(tx.registroSostenibilidad.create.mock.calls[0][0].data).toMatchObject({ costo_combustible: null, observaciones: null });
  });

  it.each(['ASIGNADA', 'EN_CURSO', 'COMPLETADA'])('acepta una ruta %s', async estado => {
    tx.ruta.findUnique.mockResolvedValue({ ...route, estado });
    await expect(service.register(routeId, complete, actorId)).resolves.toBeDefined();
  });

  it('acepta datos medidos en una ruta COMPLETADA', async () => {
    tx.ruta.findUnique.mockResolvedValue({ ...route, estado: 'COMPLETADA' });
    await service.register(routeId, { ...complete, origen_datos: 'MEDIDO' }, actorId);
    expect(tx.registroSostenibilidad.create.mock.calls[0][0].data).toMatchObject({ origen_datos: 'MEDIDO' });
  });

  it.each(['CONFIRMADA', 'ASIGNADA', 'EN_CURSO'])('rechaza datos medidos en una ruta %s e indica la condición', async estado => {
    tx.ruta.findUnique.mockResolvedValue({ ...route, estado });
    await expect(service.register(routeId, { ...complete, origen_datos: 'MEDIDO' }, actorId)).rejects.toThrow(new ConflictException('Los datos medidos solo se pueden registrar cuando la ruta está completada. Registra datos estimados o espera a que la ruta termine.'));
    expect(tx.registroSostenibilidad.create).not.toHaveBeenCalled();
  });

  it('escenario 2: con información incompleta rechaza el registro y señala toda la información requerida', async () => {
    const body = await errorBody({});
    expect(body.code).toBe('INFORMACION_INSUFICIENTE');
    expect(body.message).toBe('No se registró la información de sostenibilidad. Falta: distancia recorrida (km), combustible consumido (L), factor de emisión (kg CO₂/km), origen de los datos.');
    expect(body.campos_requeridos).toEqual(['distancia_km', 'combustible_l', 'factor_emision_kg_co2_km', 'origen_datos']);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['distancia_km', 'distancia recorrida (km)'],
    ['combustible_l', 'combustible consumido (L)'],
    ['factor_emision_kg_co2_km', 'factor de emisión (kg CO₂/km)'],
    ['origen_datos', 'origen de los datos'],
  ] as const)('escenario 2: sin %s indica solo ese dato', async (field, label) => {
    const body = await errorBody({ ...complete, [field]: null } as unknown as RegisterSustainabilityDto);
    expect(body.message).toBe(`No se registró la información de sostenibilidad. Falta: ${label}.`);
    expect(body.campos_requeridos).toEqual([field]);
    expect(tx.registroSostenibilidad.create).not.toHaveBeenCalled();
  });

  it('acepta cero como combustible y factor (vehículo eléctrico): cero no es información faltante', async () => {
    expect(missingSustainabilityFields({ ...complete, combustible_l: 0, factor_emision_kg_co2_km: 0 })).toEqual([]);
    await service.register(routeId, { ...complete, combustible_l: 0, factor_emision_kg_co2_km: 0 }, actorId);
    expect(tx.registroSostenibilidad.create.mock.calls[0][0].data.emisiones_co2_kg).toEqual(new Prisma.Decimal(0));
  });

  it('calcula las emisiones sin errores de coma flotante y con 4 decimales', () => {
    expect(estimatedEmissions(0.1, 0.2).toString()).toBe('0.02');
    expect(estimatedEmissions(10.123, 0.12345).toString()).toBe('1.2497');
  });

  it('responde 404 si la ruta no existe', async () => {
    tx.ruta.findUnique.mockResolvedValue(null);
    await expect(service.register(routeId, complete, actorId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('exige que la ruta esté confirmada', async () => {
    tx.ruta.findUnique.mockResolvedValue({ ...route, estado: 'GENERADA' });
    await expect(service.register(routeId, complete, actorId)).rejects.toThrow(new ConflictException('Confirma la ruta antes de registrar su información de sostenibilidad.'));
    expect(tx.registroSostenibilidad.create).not.toHaveBeenCalled();
  });

  it('rechaza un segundo registro de la misma ruta', async () => {
    tx.ruta.findUnique.mockResolvedValue({ ...route, sostenibilidad: { registro_id: 'previo' } });
    await expect(service.register(routeId, complete, actorId)).rejects.toThrow('La ruta ya tiene información de sostenibilidad registrada.');
    expect(tx.registroSostenibilidad.create).not.toHaveBeenCalled();
  });

  it('convierte la carrera de dos registros simultáneos (P2002) en el mismo 409', async () => {
    tx.registroSostenibilidad.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicado', { code: 'P2002', clientVersion: 'test' }));
    await expect(service.register(routeId, complete, actorId)).rejects.toThrow(new ConflictException('La ruta ya tiene información de sostenibilidad registrada.'));
  });

  it('rechaza una ruta sin versión calculada', async () => {
    tx.ruta.findUnique.mockResolvedValue({ ...route, versiones: [] });
    await expect(service.register(routeId, complete, actorId)).rejects.toThrow('La ruta no tiene una versión calculada a la que asociar la información.');
  });

  it('informa la migración pendiente y propaga los errores desconocidos', async () => {
    tx.registroSostenibilidad.create.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('sin tabla', { code: 'P2021', clientVersion: 'test' }));
    await expect(service.register(routeId, complete, actorId)).rejects.toThrow('Sistema de rutas pendiente de habilitación');
    const boom = new Error('fallo');
    tx.registroSostenibilidad.create.mockRejectedValueOnce(boom);
    await expect(service.register(routeId, complete, actorId)).rejects.toBe(boom);
  });
});

describe('US-021 validación del formato de los datos', () => {
  const errors = async (body: object) => (await validate(plainToInstance(RegisterSustainabilityDto, body))).flatMap(error => Object.values(error.constraints ?? {}));

  it('acepta un registro completo con datos opcionales', async () => {
    expect(await errors({ ...complete, costo_combustible: 10.5, observaciones: 'ok' })).toEqual([]);
    expect(await errors({ ...complete, origen_datos: 'MEDIDO' })).toEqual([]);
  });

  it.each([
    [{ distancia_km: 0 }, 'La distancia recorrida debe ser mayor que 0 km.'],
    [{ distancia_km: 10001 }, 'La distancia recorrida no puede superar 10 000 km.'],
    [{ distancia_km: '12' }, 'La distancia recorrida debe ser un número con hasta 3 decimales.'],
    [{ distancia_km: 1.2345 }, 'La distancia recorrida debe ser un número con hasta 3 decimales.'],
    [{ combustible_l: -1 }, 'El combustible consumido no puede ser negativo.'],
    [{ combustible_l: 100001 }, 'El combustible consumido no puede superar 100 000 L.'],
    [{ factor_emision_kg_co2_km: -0.1 }, 'El factor de emisión no puede ser negativo.'],
    [{ factor_emision_kg_co2_km: 101 }, 'El factor de emisión no puede superar 100 kg CO₂/km.'],
    [{ factor_emision_kg_co2_km: Number.NaN }, 'El factor de emisión debe ser un número con hasta 5 decimales.'],
    [{ origen_datos: 'INVENTADO' }, 'El origen de los datos debe ser ESTIMADO o MEDIDO.'],
    [{ costo_combustible: -1 }, 'El costo de combustible no puede ser negativo.'],
    [{ costo_combustible: 1.234 }, 'El costo de combustible debe ser un número con hasta 2 decimales.'],
    [{ observaciones: 'x'.repeat(501) }, 'Las observaciones admiten como máximo 500 caracteres.'],
  ])('rechaza %o con un mensaje claro', async (patch, message) => {
    expect(await errors({ ...complete, ...patch })).toContain(message);
  });
});
