import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { UsersService } from '../src/users/users.service';
import { ROLE_NAMES } from '../src/roles/roles';

describe('Acceso conductor HTTP + PostgreSQL aislado', () => {
  let app: INestApplication; let prisma: PrismaClient; let driverId: string; let userId: string;
  const users: string[] = []; const agents: Record<string, ReturnType<typeof request.agent>> = {};
  const password = randomBytes(24).toString('hex'); let email: string;
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || (!new URL(url).pathname.endsWith('_test') && !/^distrirapido_[a-z0-9_]+_test$/.test(new URL(url).searchParams.get('schema') ?? ''))) throw new Error('Requiere base o esquema aislado de pruebas.');
    process.env.DATABASE_URL = url; process.env.JWT_SECRET = randomBytes(48).toString('hex');
    prisma = new PrismaClient();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    // Isolated harness: distinguish simulated clients without disabling throttling.
    app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');
    configureApp(app, 'http://localhost:5173'); await app.init();
    for (const nombre of Object.values(ROLE_NAMES)) {
      const role = await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre, descripcion: 'Prueba aislada' } });
      const account = await app.get(UsersService).create({ email: `driver-${randomBytes(12).toString('hex')}@example.test`, password, rol_id: role.rol_id, estado: 'ACTIVO' });
      users.push(account.usuario_id);
      const agent = request.agent(app.getHttpServer()); await agent.post('/auth/login').send({ email: account.email, password }).expect(200); agents[nombre] = agent;
      if (nombre === ROLE_NAMES.driver) { userId = account.usuario_id; email = account.email; }
    }
    const driver = await prisma.conductor.create({ data: { usuario_id: userId, nombre_completo: 'Conductor fixture aislado', dni: randomBytes(8).toString('hex'), licencia_categoria: 'PRUEBA', telefono: 'SIN-DATO-REAL' } }); driverId = driver.conductor_id;
  });
  afterAll(async () => {
    if (app) await app.close();
    if (prisma) { if (driverId) await prisma.conductor.delete({ where: { conductor_id: driverId } }); await prisma.usuario.deleteMany({ where: { usuario_id: { in: users } } }); await prisma.$disconnect(); }
  });
  let client = 1;
  const own = () => agents[ROLE_NAMES.driver].get('/driver/me').set('X-Forwarded-For', `192.0.2.${client++}`);
  it('resuelve exclusivamente la ficha del usuario de la cookie HttpOnly', async () => {
    const response = await own().expect(200); expect(response.body).toEqual({ conductor_id: driverId, nombre_completo: 'Conductor fixture aislado', estado: 'ACTIVO' });
    await agents[ROLE_NAMES.driver].get('/auth/me').expect(200);
  });
  it.each([ROLE_NAMES.administrator, ROLE_NAMES.operator, ROLE_NAMES.auditor])('rechaza perfil con rol %s', async role => { await agents[role].get('/driver/me').expect(403); });
  it('no permite identificadores ajenos ni tokens manipulados o expirados', async () => {
    await agents[ROLE_NAMES.driver].get('/driver/me?usuario_id=' + users[0]).expect(400);
    await agents[ROLE_NAMES.driver].get('/driver/' + driverId).expect(404);
    await request(app.getHttpServer()).get('/driver/me').expect(401);
    await request(app.getHttpServer()).get('/driver/me').set('Authorization', 'Bearer tampered').expect(401);
    const expired = await app.get(JwtService).signAsync({ sub: userId }, { issuer: 'distrirapido', audience: 'distrirapido-web', algorithm: 'HS256', expiresIn: -1 });
    await request(app.getHttpServer()).get('/driver/me').set('Authorization', 'Bearer ' + expired).expect(401);
  });
  it('revalida ficha inactiva y vínculo ausente sin modificar cuentas reales', async () => {
    try {
    await prisma.conductor.update({ where: { conductor_id: driverId }, data: { estado: 'INACTIVO' } });
    expect((await own().expect(403)).body.message).toMatch(/inactiva/);
    await prisma.conductor.update({ where: { conductor_id: driverId }, data: { estado: 'ACTIVO', usuario_id: null } });
    expect((await own().expect(403)).body.message).toMatch(/no tiene un conductor vinculado/);
    } finally { await prisma.conductor.update({ where: { conductor_id: driverId }, data: { estado: 'ACTIVO', usuario_id: userId } }); }
  });
  it('cuenta inactiva rechaza login y JWT todavía vigente', async () => {
    try {
    await prisma.usuario.update({ where: { usuario_id: userId }, data: { estado: 'INACTIVO' } });
    await own().expect(401); await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(401);
    } finally { await prisma.usuario.update({ where: { usuario_id: userId }, data: { estado: 'ACTIVO' } }); }
  });
  it.each(['/users', '/roles', '/drivers', '/vehicles', '/availability', '/orders', '/admin/summary'])('conductor no consulta administración %s', async endpoint => { await agents[ROLE_NAMES.driver].get(endpoint).expect(403); });
  it('no habilita escrituras ni asignaciones arbitrarias', async () => {
    await agents[ROLE_NAMES.driver].post('/vehicles').send({}).expect(403);
    await agents[ROLE_NAMES.driver].post('/drivers').send({}).expect(403);
    await agents[ROLE_NAMES.driver].patch('/orders/' + driverId + '/status').send({ estado: 'ENTREGADO' }).expect(403);
    await agents[ROLE_NAMES.driver].post('/driver/routes').send({}).expect(404);
  });
  it('logout elimina acceso restaurable por cookie', async () => {
    await agents[ROLE_NAMES.driver].post('/auth/logout').set('Origin', 'http://localhost:5173').expect(204);
    await own().expect(401);
  });
});
