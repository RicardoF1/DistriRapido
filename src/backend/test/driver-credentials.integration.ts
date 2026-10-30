import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { assertIsolatedDatabase } from '../src/common/test-database';
import { UsersService } from '../src/users/users.service';
import { ROLE_NAMES } from '../src/roles/roles';
import { DriverCredentialsService } from '../src/drivers/driver-credentials.service';
import { PasswordService } from '../src/auth/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Restablecimiento y cambio propio: HTTP + PostgreSQL aislado', () => {
  let app: INestApplication; let p: PrismaClient; let users: UsersService; let roleId: string; let adminRole: string;
  const ids: string[] = []; const driverIds: string[] = []; let counter = 1;
  const agents: Record<string, ReturnType<typeof request.agent>> = {};
  const password = randomBytes(20).toString('hex');
  const email = () => `credentials-${randomBytes(10).toString('hex')}@example.test`;
  beforeAll(async () => {
    assertIsolatedDatabase(process.env.TEST_DATABASE_URL);
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = randomBytes(48).toString('hex'); p = new PrismaClient();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile(); app = module.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', 'loopback'); configureApp(app, 'http://localhost:5173'); await app.init(); users = app.get(UsersService);
    for (const name of Object.values(ROLE_NAMES)) {
      const role = await p.rol.upsert({ where: { nombre: name }, update: {}, create: { nombre: name, descripcion: 'Prueba aislada' } });
      if (name === ROLE_NAMES.driver) roleId = role.rol_id;
      if (name === ROLE_NAMES.administrator) adminRole = role.rol_id;
      const user = await users.create({ email: email(), password, rol_id: role.rol_id }); ids.push(user.usuario_id);
      const agent = request.agent(app.getHttpServer()); await agent.post('/auth/login').send({ email: user.email, password }).expect(200); agents[name] = agent;
    }
  });
  beforeEach(async () => {
    // Independent synthetic actors prevent unrelated cases sharing a frequency budget.
    const user = await users.create({ email: email(), password, rol_id: adminRole }); ids.push(user.usuario_id);
    const agent = request.agent(app.getHttpServer()); await agent.post('/auth/login').set('X-Forwarded-For', `192.0.2.${counter++}`).send({ email: user.email, password }).expect(200); agents[ROLE_NAMES.administrator] = agent;
  });
  afterAll(async () => {
    if (app) await app.close();
    if (p) { await p.conductor.deleteMany({ where: { conductor_id: { in: driverIds } } }); await p.usuario.deleteMany({ where: { usuario_id: { in: ids } } }); await p.$disconnect(); }
  });
  async function fixture() {
    const user = await users.create({ email: email(), password, rol_id: roleId }); ids.push(user.usuario_id);
    const driver = await p.conductor.create({ data: { usuario_id: user.usuario_id, nombre_completo: 'Conductor sintético', dni: randomBytes(8).toString('hex'), licencia_categoria: 'PRUEBA', telefono: 'SIN-DATOS-REALES' } }); driverIds.push(driver.conductor_id);
    const agent = request.agent(app.getHttpServer()); const login = await agent.post('/auth/login').set('X-Forwarded-For', `192.0.2.${counter++}`).send({ email: user.email, password }).expect(200);
    const dto = { password: 'Una frase sintética nueva', password_confirmation: 'Una frase sintética nueva', expected_usuario_id: user.usuario_id, expected_credentials_version: 0, confirmed: true };
    return { user, driver, agent, token: login.body.accessToken, dto };
  }
  function reset(id: string, dto: object, role = ROLE_NAMES.administrator as string) { return agents[role].post(`/drivers/${id}/account/reset-password`).set('Origin', 'http://localhost:5173').set('X-Forwarded-For', `192.0.2.${counter++}`).send(dto); }
  it('restablece Argon2id, conserva ficha/estado/vínculo, revoca cookies y Bearer, admite solo nueva contraseña', async () => {
    const f = await fixture(); const before = await p.conductor.findUnique({ where: { conductor_id: f.driver.conductor_id } });
    const legacy = await app.get(JwtService).signAsync({ sub: f.user.usuario_id }, { issuer: 'distrirapido', audience: 'distrirapido-web', expiresIn: 900 });
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer ' + legacy).expect(200);
    const meta = await agents[ROLE_NAMES.administrator].get(`/drivers/${f.driver.conductor_id}/account/credentials`).expect(200);
    expect(meta.body).toEqual({ usuario_id: f.user.usuario_id, email: f.user.email, estado: 'ACTIVO', credentials_version: 0 });
    const response = await reset(f.driver.conductor_id, f.dto).expect(200);
    expect(Object.keys(response.body)).toEqual(['message']); expect(response.headers['cache-control']).toBe('no-store');
    const stored = await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } });
    expect(stored.password_hash.startsWith('$argon2id$')).toBe(true); expect(await argon2.verify(stored.password_hash, f.dto.password)).toBe(true);
    expect(stored.credentials_version).toBe(1); expect(stored.email).toBe(f.user.email); expect(stored.rol_id).toBe(f.user.rol_id); expect(stored.estado).toBe('ACTIVO');
    expect(await p.conductor.findUnique({ where: { conductor_id: f.driver.conductor_id } })).toEqual(before);
    await f.agent.get('/auth/me').expect(401);
    for (const token of [f.token, legacy]) await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer ' + token).expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({ email: f.user.email, password }).expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({ email: f.user.email, password: f.dto.password }).expect(200);
    await agents[ROLE_NAMES.administrator].get('/auth/me').expect(200);
  });
  it.each([ROLE_NAMES.operator, ROLE_NAMES.driver, ROLE_NAMES.auditor])('deniega reset y metadatos a %s', async role => {
    const f = await fixture(); await reset(f.driver.conductor_id, f.dto, role).expect(403);
    await agents[role].get(`/drivers/${f.driver.conductor_id}/account/credentials`).expect(403);
    expect((await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } })).credentials_version).toBe(0);
  });
  it('rechaza DTO inválido, confirmación distinta, contraseña actual repetida y usuario manipulado', async () => {
    const f = await fixture();
    await reset(f.driver.conductor_id, { ...f.dto, password_confirmation: 'Otra frase sintética' }).expect(400);
    await reset(f.driver.conductor_id, { ...f.dto, password: 'corta', password_confirmation: 'corta' }).expect(400);
    await reset(f.driver.conductor_id, { ...f.dto, expected_usuario_id: randomUUID() }).expect(409);
    await reset(f.driver.conductor_id, { ...f.dto, password, password_confirmation: password }).expect(400);
    await reset(f.driver.conductor_id, { ...f.dto, usuario_id: randomUUID() }).expect(400);
    expect((await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } })).credentials_version).toBe(0);
  });
  it('cambio propio exige contraseña actual, deriva cuenta de sesión y revoca su sesión actual', async () => {
    const f = await fixture();
    const body = { password: f.dto.password, password_confirmation: f.dto.password_confirmation, current_password: 'incorrecta' };
    await f.agent.post('/driver/account/password').set('Origin', 'http://localhost:5173').send(body).expect(400);
    await f.agent.post('/driver/account/password').set('Origin', 'http://localhost:5173').send({ ...body, current_password: password, usuario_id: randomUUID() }).expect(400);
    await f.agent.post('/driver/account/password').set('Origin', 'http://localhost:5173').send({ ...body, current_password: password }).expect(200);
    await f.agent.get('/auth/me').expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({ email: f.user.email, password: f.dto.password }).expect(200);
  });
  it.each([ROLE_NAMES.administrator, ROLE_NAMES.operator, ROLE_NAMES.auditor])('Mi cuenta no habilita cambio para %s', async role => {
    await agents[role].post('/driver/account/password').set('Origin', 'http://localhost:5173').send({ current_password: password, password: 'Nueva frase sintética', password_confirmation: 'Nueva frase sintética' }).expect(403);
  });
  it('dos cambios simultáneos con la misma versión: uno persiste y otro recibe conflicto', async () => {
    const f = await fixture(); const alternate = { ...f.dto, password: 'Otra frase sintética nueva', password_confirmation: 'Otra frase sintética nueva' };
    // Use service directly to isolate database concurrency from HTTP frequency budgets.
    const service = app.get(DriverCredentialsService);
    const results = await Promise.allSettled([service.reset(f.driver.conductor_id, f.dto), service.reset(f.driver.conductor_id, alternate)]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(r => r.status === 'rejected') as PromiseRejectedResult; expect(rejected.reason.getStatus()).toBe(409);
    expect((await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } })).credentials_version).toBe(1);
  });
  it('rollback real si falla después de escribir hash y versión', async () => {
    const f = await fixture(); const before = await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } });
    const wrapper = { conductor: p.conductor, $transaction: (operation: (tx: unknown) => Promise<void>) => p.$transaction(async tx => { await operation(tx); throw new Error('Fallo sintético después de UPDATE'); }) };
    const service = new DriverCredentialsService(wrapper as unknown as PrismaService, app.get(PasswordService));
    await expect(service.reset(f.driver.conductor_id, f.dto)).rejects.toThrow('Fallo sintético');
    expect(await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } })).toEqual(before);
  });
  it('origen ajeno y cuenta sin vínculo no permiten escritura', async () => {
    const f = await fixture();
    await agents[ROLE_NAMES.administrator].post(`/drivers/${f.driver.conductor_id}/account/reset-password`).set('Origin', 'https://untrusted.example').send(f.dto).expect(403);
    await reset(randomUUID(), f.dto).expect(404);
  });
  it('HTTP limita intentos repetidos sin alterar el hash', async () => {
    const f = await fixture(); const stored = await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } });
    for (let n = 0; n < 5; n++) await reset(f.driver.conductor_id, { ...f.dto, password_confirmation: 'No coincide esta frase' }).expect(400);
    await reset(f.driver.conductor_id, f.dto).expect(429);
    expect(await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } })).toEqual(stored);
  });
  it('un vínculo cambiado mientras se calcula Argon2 no permite cambiar ninguna cuenta', async () => {
    const f = await fixture(); const next = await users.create({ email: email(), password, rol_id: roleId }); ids.push(next.usuario_id);
    const before = await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } });
    const actual = app.get(PasswordService);
    const passwordService = { verify: actual.verify.bind(actual), hash: async (value: string) => { await p.conductor.update({ where: { conductor_id: f.driver.conductor_id }, data: { usuario_id: next.usuario_id } }); return actual.hash(value); } };
    const service = new DriverCredentialsService(p as PrismaService, passwordService as PasswordService);
    await expect(service.reset(f.driver.conductor_id, f.dto)).rejects.toThrow('cambiaron');
    expect(await p.usuario.findUniqueOrThrow({ where: { usuario_id: f.user.usuario_id } })).toEqual(before);
    expect((await p.usuario.findUniqueOrThrow({ where: { usuario_id: next.usuario_id } })).credentials_version).toBe(0);
  });
});
