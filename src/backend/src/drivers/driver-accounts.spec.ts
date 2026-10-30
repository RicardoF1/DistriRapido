import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { DriversModule } from './drivers.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { configureApp } from '../common/configure-app';

const driverId = '00000000-0000-4000-8000-000000000001';
const accountId = '00000000-0000-4000-8000-000000000002';
const previousId = '00000000-0000-4000-8000-000000000003';
const account = { usuario_id: accountId, email: 'eligible@example.test', estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' }, conductor: null };
const emptyDriver = { conductor_id: driverId, nombre_completo: 'Fixture', dni: 'fixture', licencia_categoria: 'PRUEBA', telefono: 'fixture', anios_experiencia: 0, estado: 'ACTIVO', usuario_id: null as string | null };
let driver = { ...emptyDriver };
const p = { conductor: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() }, usuario: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn() }, rol: { findUnique: jest.fn() }, $transaction: jest.fn() };
describe('Cuentas de conductores HTTP', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), DriversModule] })
      .overrideProvider(PrismaService).useValue(p).overrideProvider(ConfigService).useValue({ getOrThrow: () => 'http://localhost:5173' })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate(ctx: ExecutionContext) { const req = ctx.switchToHttp().getRequest(); if (!req.headers['x-role']) throw new UnauthorizedException(); req.user = { rol: { nombre: decodeURIComponent(req.headers['x-role']) } }; return true; } }).compile();
    app = module.createNestApplication(); configureApp(app, 'http://localhost:5173'); await app.init();
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(() => {
    jest.resetAllMocks(); driver = { ...emptyDriver };
    p.$transaction.mockImplementation(async task => typeof task === 'function' ? task(p) : Promise.all(task));
    p.conductor.findUnique.mockImplementation(async () => ({ ...driver, usuario: driver.usuario_id ? { usuario_id: driver.usuario_id, email: account.email, estado: account.estado } : null }));
    p.conductor.updateMany.mockImplementation(async ({ data }) => { driver.usuario_id = data.usuario_id; return { count: 1 }; });
    p.usuario.findMany.mockResolvedValue([account]); p.usuario.count.mockResolvedValue(1); p.usuario.findUnique.mockResolvedValue(account);
    p.usuario.create.mockResolvedValue(account); p.rol.findUnique.mockResolvedValue({ rol_id: accountId, nombre: account.rol.nombre });
    p.conductor.update.mockImplementation(async () => ({ ...driver }));
  });
  const admin = () => request(app.getHttpServer());
  const header = ['x-role', 'Administrador'] as const;
  it('lista opciones mínimas filtradas y paginadas', async () => {
    const r = await admin().get('/drivers/account-options?search=eligible&page=1&pageSize=10').set(...header).expect(200);
    expect(r.body.items).toEqual([{ usuario_id: accountId, email: account.email, estado: 'ACTIVO' }]);
    expect(p.usuario.findMany.mock.calls[0][0].where).toMatchObject({ estado: 'ACTIVO', rol: { nombre: 'Usuario Final / Conductor' } });
    expect(r.body.total).toBe(1); expect(JSON.stringify(r.body)).not.toMatch(/password|rol_id/);
  });
  it.each(['Operador / Técnico', 'Usuario Final / Conductor', 'Auditor Externo'])('bloquea operaciones sensibles para %s', async role => {
    const encoded = encodeURIComponent(role);
    await admin().get('/drivers/account-options').set('x-role', encoded).expect(403);
    await admin().put(`/drivers/${driverId}/account`).set('x-role', encoded).send({ usuario_id: accountId, expected_usuario_id: null }).expect(403);
    await admin().post(`/drivers/${driverId}/account`).set('x-role', encoded).send({ email: account.email, password: 'fixture-password-123' }).expect(403);
    expect(p.usuario.findMany).not.toHaveBeenCalled(); expect(p.usuario.create).not.toHaveBeenCalled();
  });
  it('permite preflight PUT desde frontend para vincular cuentas', async () => {
    const result = await admin().options('/drivers/' + driverId + '/account').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'PUT').set('Access-Control-Request-Headers', 'Content-Type').expect(204);
    expect(result.headers['access-control-allow-methods'].split(',')).toContain('PUT');
  });
  it('rechaza sesión ausente y origen ajeno', async () => {
    await admin().get('/drivers/account-options').expect(401);
    await admin().put(`/drivers/${driverId}/account`).set(...header).set('Origin', 'https://evil.example').send({ usuario_id: accountId, expected_usuario_id: null }).expect(403);
  });
  it('operador no envía usuario_id por endpoints antiguos, tampoco null', async () => {
    await admin().patch('/drivers/' + driverId).set('x-role', encodeURIComponent('Operador / Técnico')).send({ usuario_id: null }).expect(403);
    await admin().post('/drivers').set('x-role', encodeURIComponent('Operador / Técnico')).send({ ...emptyDriver, conductor_id: undefined, usuario_id: accountId }).expect(403);
    expect(p.conductor.update).not.toHaveBeenCalled(); expect(p.conductor.create).not.toHaveBeenCalled();
  });
  it('no permite reemplazar ni desvincular mediante PATCH antiguo', async () => {
    driver.usuario_id = previousId;
    await admin().patch('/drivers/' + driverId).set(...header).send({ usuario_id: accountId }).expect(400);
    await admin().patch('/drivers/' + driverId).set(...header).send({ usuario_id: null }).expect(400);
  });
  it('operador recibe vínculo booleano sin correo ni UUID de cuenta', async () => {
    driver.usuario_id = previousId;
    const r = await admin().get('/drivers/' + driverId).set('x-role', encodeURIComponent('Operador / Técnico')).expect(200);
    expect(r.body.cuenta_vinculada).toBe(true); expect(r.body).not.toHaveProperty('usuario_id'); expect(r.body).not.toHaveProperty('cuenta'); expect(JSON.stringify(r.body)).not.toContain(account.email);
  });
  it('administrador recibe correo y estado de la cuenta vinculada', async () => {
    driver.usuario_id = accountId;
    const r = await admin().get('/drivers/' + driverId).set(...header).expect(200);
    expect(r.body.cuenta).toEqual({ usuario_id: accountId, email: account.email, estado: 'ACTIVO' });
  });
  it('vincula una cuenta elegible y no devuelve secretos', async () => {
    const r = await admin().put(`/drivers/${driverId}/account`).set(...header).send({ usuario_id: accountId, expected_usuario_id: null }).expect(200);
    expect(r.body.cuenta.usuario_id).toBe(accountId); expect(p.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }));
  });
  it('exige confirmación y detecta versión obsoleta del vínculo', async () => {
    driver.usuario_id = previousId;
    await admin().put(`/drivers/${driverId}/account`).set(...header).send({ usuario_id: accountId, expected_usuario_id: previousId }).expect(409);
    await admin().put(`/drivers/${driverId}/account`).set(...header).send({ usuario_id: accountId, expected_usuario_id: null, confirm_replacement: true }).expect(409);
    expect(p.conductor.updateMany).not.toHaveBeenCalled();
    await admin().put(`/drivers/${driverId}/account`).set(...header).send({ usuario_id: accountId, expected_usuario_id: previousId, confirm_replacement: true }).expect(200);
  });
  it('no admite cuenta nula, campos de rol ni estado impuestos', async () => {
    await admin().put(`/drivers/${driverId}/account`).set(...header).send({ usuario_id: null, expected_usuario_id: null }).expect(400);
    await admin().post(`/drivers/${driverId}/account`).set(...header).send({ email: account.email, password: 'fixture-password-123', rol_id: previousId }).expect(400);
  });
  it.each([{ ...account, estado: 'INACTIVO' }, { ...account, rol: { nombre: 'Administrador' } }])('rechaza cuenta no elegible', async value => {
    p.usuario.findUnique.mockResolvedValue(value);
    await admin().put(`/drivers/${driverId}/account`).set(...header).send({ usuario_id: accountId, expected_usuario_id: null }).expect(400);
    expect(p.conductor.updateMany).not.toHaveBeenCalled();
  });
  it('crea cuenta y vínculo en la misma transacción, hash Argon2id sin contraseña de respuesta', async () => {
    const r = await admin().post(`/drivers/${driverId}/account`).set(...header).send({ email: account.email, password: 'fixture-password-123' }).expect(201);
    expect(r.body.cuenta.usuario_id).toBe(accountId); expect(p.usuario.create.mock.calls[0][0].data.password_hash).toMatch(/^\$argon2id\$/); expect(JSON.stringify(r.body)).not.toMatch(/password|hash/);
  });
  it('no crea otra cuenta si el conductor ya tiene una', async () => {
    driver.usuario_id = previousId;
    await admin().post(`/drivers/${driverId}/account`).set(...header).send({ email: account.email, password: 'fixture-password-123' }).expect(409);
    expect(p.usuario.create).not.toHaveBeenCalled();
  });
  it('traduce conflictos concurrentes a 409', async () => {
    p.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('fixture', { code: 'P2034', clientVersion: 'test' }));
    await admin().put(`/drivers/${driverId}/account`).set(...header).send({ usuario_id: accountId, expected_usuario_id: null }).expect(409);
  });
});
