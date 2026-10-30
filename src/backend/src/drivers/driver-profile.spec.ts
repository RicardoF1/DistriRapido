import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import request from 'supertest';
import { DriversModule } from './drivers.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { configureApp } from '../common/configure-app';

const userId = '00000000-0000-4000-8000-000000000001';
const driverId = '00000000-0000-4000-8000-000000000002';
const findUnique = jest.fn();
describe('Perfil operativo propio del conductor HTTP', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), DriversModule] })
      .overrideProvider(PrismaService).useValue({ conductor: { findUnique } })
      .overrideProvider(ConfigService).useValue({ getOrThrow: () => 'http://localhost:5173' })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        if (!req.headers['x-test-role'] || req.headers['x-test-inactive']) throw new UnauthorizedException();
        req.user = { usuario_id: userId, rol: { nombre: decodeURIComponent(req.headers['x-test-role']) } };
        return true;
      } }).compile();
    app = module.createNestApplication(); configureApp(app, 'http://localhost:5173'); await app.init();
  });
  beforeEach(() => { jest.clearAllMocks(); findUnique.mockResolvedValue({ conductor_id: driverId, nombre_completo: 'Conductor fixture', estado: 'ACTIVO', usuario: { estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } } }); });
  afterAll(async () => { await app?.close(); });
  const own = () => request(app.getHttpServer()).get('/driver/me').set('x-test-role', encodeURIComponent('Usuario Final / Conductor'));
  it('devuelve solo identidad propia y no permite cache', async () => {
    const response = await own().expect(200);
    expect(response.body).toEqual({ conductor_id: driverId, nombre_completo: 'Conductor fixture', estado: 'ACTIVO' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(findUnique.mock.calls[0][0].where).toEqual({ usuario_id: userId });
  });
  it.each(['Administrador', 'Operador / Técnico', 'Auditor Externo'])('rechaza rol %s sin consultar otra identidad', async role => {
    await request(app.getHttpServer()).get('/driver/me').set('x-test-role', encodeURIComponent(role)).expect(403);
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('rechaza sesión ausente o usuario inactivo', async () => {
    await request(app.getHttpServer()).get('/driver/me').expect(401);
    await own().set('x-test-inactive', '1').expect(401);
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('distingue ficha ausente e inactiva', async () => {
    findUnique.mockResolvedValueOnce(null);
    expect((await own().expect(403)).body.message).toMatch(/no tiene un conductor vinculado/);
    findUnique.mockResolvedValueOnce({ conductor_id: driverId, estado: 'INACTIVO' });
    expect((await own().expect(403)).body.message).toMatch(/inactiva/);
  });
  it('revalida cuenta y rol asociados después de la autenticación', async () => {
    findUnique.mockResolvedValueOnce({ estado: 'ACTIVO', usuario: { estado: 'INACTIVO' } }); await own().expect(401);
    findUnique.mockResolvedValueOnce({ estado: 'ACTIVO', usuario: { estado: 'ACTIVO', rol: { nombre: 'Administrador' } } }); await own().expect(403);
  });
  it('rechaza identificadores y no ofrece un endpoint de otros conductores', async () => {
    await request(app.getHttpServer()).get('/driver/me?conductor_id=' + driverId).set('x-test-role', encodeURIComponent('Usuario Final / Conductor')).expect(400);
    await request(app.getHttpServer()).get('/driver/' + driverId).set('x-test-role', encodeURIComponent('Usuario Final / Conductor')).expect(404);
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('no convierte un fallo de datos en identidad vacía', async () => {
    findUnique.mockRejectedValueOnce(new Error('failure')); await own().expect(500);
  });
});
