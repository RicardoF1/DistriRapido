import { BadRequestException, ConflictException, ExecutionContext, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../roles/roles';
import { VehiclesGuard } from './vehicles.guard';
import { CreateVehicleDto } from './vehicle.dto';
import { VehiclesService } from './vehicles.service';

describe('US-007 gestionar vehículos', () => {
  const valid = { placa: 'ABC-123', tipo: 'Furgón', capacidad_carga_kg: 1000, capacidad_volumen_m3: 12, consumo_km_l: 8, factor_emision_kg_co2_km: 0.25, anio_fabricacion: 2022, estado: 'DISPONIBLE' };
  const vehicle = { vehiculo_id: 'vehicle-id', ...valid };
  const prisma = { vehiculo: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() } };
  let service: VehiclesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new VehiclesService(prisma as unknown as PrismaService);
    prisma.vehiculo.findMany.mockResolvedValue([vehicle]);
    prisma.vehiculo.findUnique.mockResolvedValue(vehicle);
    prisma.vehiculo.create.mockResolvedValue(vehicle);
    prisma.vehiculo.update.mockResolvedValue({ ...vehicle, estado: 'MANTENIMIENTO' });
  });

  it('lista, registra y edita datos y estado', async () => {
    await expect(service.list()).resolves.toEqual([vehicle]);
    await expect(service.create(valid)).resolves.toEqual(vehicle);
    await expect(service.update(vehicle.vehiculo_id, { tipo: 'Camión', estado: 'MANTENIMIENTO' })).resolves.toMatchObject({ estado: 'MANTENIMIENTO' });
    expect(prisma.vehiculo.create).toHaveBeenCalledWith({ data: { ...valid, capacidad_volumen_m3: 12 } });
    expect(prisma.vehiculo.update).toHaveBeenCalledWith({ where: { vehiculo_id: vehicle.vehiculo_id }, data: { tipo: 'Camión', estado: 'MANTENIMIENTO' } });
  });

  it('traduce placa duplicada y vehículo inexistente', async () => {
    prisma.vehiculo.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' }));
    await expect(service.create(valid)).rejects.toBeInstanceOf(ConflictException);
    prisma.vehiculo.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: 'test' }));
    await expect(service.update(vehicle.vehiculo_id, { estado: 'INACTIVO' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza actualización vacía y DTO inválido', async () => {
    await expect(service.update(vehicle.vehiculo_id, {})).rejects.toBeInstanceOf(BadRequestException);
    const dto = plainToInstance(CreateVehicleDto, { ...valid, capacidad_carga_kg: 0, consumo_km_l: -1, estado: 'INVALIDO' });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('solo autoriza al Administrador', () => {
    const guard = new VehiclesGuard();
    const contextFor = (role: string) => ({ switchToHttp: () => ({ getRequest: () => ({ user: { rol: { nombre: role } } }) }) }) as ExecutionContext;
    expect(guard.canActivate(contextFor(ROLE_NAMES.administrator))).toBe(true);
    for (const role of [ROLE_NAMES.operator, ROLE_NAMES.driver, ROLE_NAMES.auditor]) expect(() => guard.canActivate(contextFor(role))).toThrow('No tienes permisos');
  });
});
