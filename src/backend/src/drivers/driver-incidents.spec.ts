import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DriverProfileService } from './driver-profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryIncidentDto, INCIDENT_TYPES } from './dto/create-delivery-incident.dto';

const user = { usuario_id: '00000000-0000-4000-8000-000000000001', email: 'driver@example.test', expiresAt: Date.now() + 60000, rol: { rol_id: '00000000-0000-4000-8000-000000000010', nombre: 'Usuario Final / Conductor' } };
const driverId = '00000000-0000-4000-8000-000000000002';
const stopId = '00000000-0000-4000-8000-000000000004';
const stop = { parada_id: stopId, ruta_version: { numero: 1, ruta: { conductor_id: driverId, estado: 'EN_CURSO', current_version: 1 } } };
const tx = { paradaRuta: { findUnique: jest.fn() }, incidenciaEntrega: { create: jest.fn() } };
const prisma = { conductor: { findUnique: jest.fn() }, $transaction: jest.fn() };
let service: DriverProfileService;

beforeEach(() => {
  jest.resetAllMocks();
  prisma.conductor.findUnique.mockResolvedValue({ conductor_id: driverId, nombre_completo: 'Driver', estado: 'ACTIVO', usuario: { estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } } });
  prisma.$transaction.mockImplementation((operation: (db: typeof tx) => unknown) => operation(tx));
  tx.paradaRuta.findUnique.mockResolvedValue(stop);
  tx.incidenciaEntrega.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ incidencia_id: 'inc-1', registrado_en: new Date(), ...data }));
  service = new DriverProfileService(prisma as unknown as PrismaService);
});

describe('US-018 / RF-015: registrar incidencias de entrega', () => {
  it('asocia la incidencia a la entrega propia y al conductor de la sesión', async () => {
    const result = await service.createIncident(user, stopId, { tipo: 'CLIENTE_AUSENTE', descripcion: '  Nadie atiende  ' });
    expect(tx.incidenciaEntrega.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { parada_id: stopId, conductor_id: driverId, tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende', detalle_complementario: null },
    }));
    expect(result.parada_id).toBe(stopId);
  });

  it('guarda la información complementaria permitida', async () => {
    await service.createIncident(user, stopId, { tipo: 'VIA_BLOQUEADA', descripcion: 'Obra en la avenida', detalle_complementario: ' Desvío por Jr. Puno ' });
    expect(tx.incidenciaEntrega.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ detalle_complementario: 'Desvío por Jr. Puno' }) }));
  });

  it('no modifica el estado de la entrega', async () => {
    await service.createIncident(user, stopId, { tipo: 'OTRO', descripcion: 'Detalle' });
    expect(Object.keys(tx.paradaRuta)).toEqual(['findUnique']);
  });

  it('rechaza descripción vacía tras recortar', async () => {
    await expect(service.createIncident(user, stopId, { tipo: 'OTRO', descripcion: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.incidenciaEntrega.create).not.toHaveBeenCalled();
  });

  it('deniega entregas ajenas o inexistentes', async () => {
    tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, ruta_version: { ...stop.ruta_version, ruta: { ...stop.ruta_version.ruta, conductor_id: 'other' } } });
    await expect(service.createIncident(user, stopId, { tipo: 'OTRO', descripcion: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
    tx.paradaRuta.findUnique.mockResolvedValueOnce(null);
    await expect(service.createIncident(user, stopId, { tipo: 'OTRO', descripcion: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.incidenciaEntrega.create).not.toHaveBeenCalled();
  });

  it('rechaza versiones antiguas y rutas completadas', async () => {
    tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, ruta_version: { ...stop.ruta_version, numero: 0 } });
    await expect(service.createIncident(user, stopId, { tipo: 'OTRO', descripcion: 'x' })).rejects.toBeInstanceOf(ConflictException);
    tx.paradaRuta.findUnique.mockResolvedValueOnce({ ...stop, ruta_version: { ...stop.ruta_version, ruta: { ...stop.ruta_version.ruta, estado: 'COMPLETADA' } } });
    await expect(service.createIncident(user, stopId, { tipo: 'OTRO', descripcion: 'x' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('exige el rol conductor', async () => {
    await expect(service.createIncident({ ...user, rol: { ...user.rol, nombre: 'Administrador' } }, stopId, { tipo: 'OTRO', descripcion: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('US-018: validación de datos obligatorios', () => {
  const messages = async (data: Record<string, unknown>) =>
    (await validate(plainToInstance(CreateDeliveryIncidentDto, data), { whitelist: true, forbidNonWhitelisted: true }))
      .flatMap(error => Object.values(error.constraints ?? {}));

  it('acepta todos los tipos del catálogo', async () => {
    for (const tipo of INCIDENT_TYPES) expect(await messages({ tipo, descripcion: 'Detalle' })).toEqual([]);
  });

  it('señala cada dato faltante', async () => {
    const errors = await messages({});
    expect(errors).toEqual(expect.arrayContaining(['tipo: selecciona el tipo de incidencia.', 'descripcion: describe la incidencia.']));
  });

  it.each([
    { tipo: 'INVENTADO', descripcion: 'x' },
    { tipo: 'OTRO', descripcion: '   ' },
    { tipo: 'OTRO', descripcion: 'a'.repeat(501) },
    { tipo: 'OTRO', descripcion: 'x', detalle_complementario: 'a'.repeat(501) },
    { tipo: 'OTRO', descripcion: 'x', estado_entrega: 'ENTREGADA' },
  ])('rechaza datos inválidos %j', async data => {
    expect((await messages(data)).length).toBeGreaterThan(0);
  });

  it('trata el detalle complementario vacío como ausente', async () => {
    const dto = plainToInstance(CreateDeliveryIncidentDto, { tipo: 'OTRO', descripcion: 'x', detalle_complementario: '   ' });
    expect(dto.detalle_complementario).toBeUndefined();
    expect(await validate(dto)).toHaveLength(0);
  });
});
