import { ForbiddenException } from '@nestjs/common';
import { DriverProfileService } from './driver-profile.service';
import { PrismaService } from '../prisma/prisma.service';

const user = { usuario_id: '00000000-0000-4000-8000-000000000001', email: 'driver@example.test', expiresAt: Date.now() + 60000, rol: { rol_id: '00000000-0000-4000-8000-000000000010', nombre: 'Usuario Final / Conductor' } };
const driverId = '00000000-0000-4000-8000-000000000002';
const routeId = '00000000-0000-4000-8000-000000000003';
const driver = { conductor_id: driverId, nombre_completo: 'Conductor fixture', estado: 'ACTIVO', usuario: { estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } } };
const stops = [
  { parada_id: 'a', estado_entrega: 'ENTREGADA' },
  { parada_id: 'b', estado_entrega: 'PENDIENTE' },
];
const route = { ruta_id: routeId, estado: 'ASIGNADA', asignado_en: new Date(), iniciado_en: null, finalizado_en: null, current_version: 1, versiones: [{ ruta_version_id: 'v', numero: 1, distancia_m: 10, duracion_s: 20, resultado: {}, vehiculo: { vehiculo_id: 'veh', placa: 'ABC', tipo: 'VAN' }, paradas: stops }] };
const prisma = { conductor: { findUnique: jest.fn() }, ruta: { findMany: jest.fn(), findFirst: jest.fn() } };
let service: DriverProfileService;

beforeEach(() => {
  jest.resetAllMocks();
  prisma.conductor.findUnique.mockResolvedValue(driver);
  prisma.ruta.findMany.mockResolvedValue([route]);
  prisma.ruta.findFirst.mockResolvedValue(route);
  service = new DriverProfileService(prisma as unknown as PrismaService);
});

it('lista solo rutas activas del conductor autenticado y calcula progreso', async () => {
  const result = await service.routes(user);
  expect(result[0].progress).toEqual({ total: 2, processed: 1, percentage: 50 });
  expect(prisma.ruta.findMany.mock.calls[0][0].where).toEqual({ conductor_id: driverId, estado: { in: ['ASIGNADA', 'EN_CURSO'] } });
});

it('devuelve detalle ordenado sin recibir conductor_id del cliente', async () => {
  await expect(service.route(user, routeId)).resolves.toMatchObject({ ruta_id: routeId, progress: { percentage: 50 } });
  expect(prisma.ruta.findFirst.mock.calls[0][0].where).toEqual({ ruta_id: routeId, conductor_id: driverId, estado: { in: ['ASIGNADA', 'EN_CURSO', 'COMPLETADA'] } });
});

it('oculta rutas ajenas como acceso denegado', async () => {
  prisma.ruta.findFirst.mockResolvedValueOnce(null);
  await expect(service.route(user, routeId)).rejects.toBeInstanceOf(ForbiddenException);
});

it('revalida rol, vinculo, ficha y cuenta antes de consultar rutas', async () => {
  await expect(service.routes({ ...user, rol: { ...user.rol, nombre: 'Administrador' } })).rejects.toBeInstanceOf(ForbiddenException);
  prisma.conductor.findUnique.mockResolvedValueOnce(null);
  await expect(service.routes(user)).rejects.toBeInstanceOf(ForbiddenException);
  prisma.conductor.findUnique.mockResolvedValueOnce({ ...driver, estado: 'INACTIVO' });
  await expect(service.routes(user)).rejects.toBeInstanceOf(ForbiddenException);
});