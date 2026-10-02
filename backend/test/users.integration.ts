import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { ROLE_NAMES } from '../src/roles/roles';
describe('RF-002 → US-003 HTTP + PostgreSQL', () => {
  let app: INestApplication; let prisma: PrismaClient; let admin: ReturnType<typeof request.agent>; let operator: ReturnType<typeof request.agent>;
  let adminId: string; let operatorId: string; let createdId: string; let adminRole: string; let operatorRole: string;
  const password = randomBytes(24).toString('hex'); const prefix = `us003-${randomUUID()}`; const email = `${prefix}@example.com`;
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || (!new URL(url).pathname.endsWith('_test') && !/^distrirapido_[a-z0-9_]+_test$/.test(new URL(url).searchParams.get('schema') ?? ''))) throw new Error('Usa una base _test o un esquema aislado distrirapido_*_test.');
    process.env.DATABASE_URL = url; prisma = new PrismaClient();
    const roles = await Promise.all(Object.values(ROLE_NAMES).map((nombre) => prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre, descripcion: 'Pruebas US-003' } })));
    adminRole = roles.find((role) => role.nombre === ROLE_NAMES.administrator)!.rol_id; operatorRole = roles.find((role) => role.nombre === ROLE_NAMES.operator)!.rol_id;
    const password_hash = await argon2.hash(password, { type: argon2.argon2id });
    adminId = (await prisma.usuario.create({ data: { email: `admin-${email}`, rol_id: adminRole, password_hash } })).usuario_id;
    operatorId = (await prisma.usuario.create({ data: { email: `operator-${email}`, rol_id: operatorRole, password_hash } })).usuario_id;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile(); app = module.createNestApplication(); configureApp(app, app.get(ConfigService).getOrThrow<string>('FRONTEND_ORIGIN')); await app.init();
    admin = request.agent(app.getHttpServer()); operator = request.agent(app.getHttpServer());
    await admin.post('/auth/login').send({ email: `admin-${email}`, password }).expect(200);
    await operator.post('/auth/login').send({ email: `operator-${email}`, password }).expect(200);
  });
  afterAll(async () => { if (app) await app.close(); if (prisma) { await prisma.usuario.deleteMany({ where: { usuario_id: { in: [adminId, operatorId, createdId].filter(Boolean) } } }); await prisma.$disconnect(); } });
  it('Administrador lista/consulta cuentas y roles sin hashes', async () => {
    const users = await admin.get('/users').expect(200); const one = await admin.get(`/users/${adminId}`).expect(200); const roles = await admin.get('/roles').expect(200);
    expect(users.body.some((item: { usuario_id: string }) => item.usuario_id === adminId)).toBe(true);
    expect(one.body.email).toBe(`admin-${email}`); expect(roles.body.map((role: { nombre: string }) => role.nombre).sort()).toEqual(Object.values(ROLE_NAMES).sort());
    expect(JSON.stringify([users.body, one.body, roles.body])).not.toMatch(/password|hash|accessToken|JWT_SECRET|DATABASE_URL/);
  });
  it('crea usuario válido y guarda Argon2id sin devolver contraseña/hash', async () => {
    const response = await admin.post('/users').send({ email: email.toUpperCase(), password, rol_id: operatorRole, estado: 'ACTIVO' }).expect(201); createdId = response.body.usuario_id;
    expect(response.body.email).toBe(email); expect(response.body).not.toHaveProperty('password_hash'); expect(response.body).not.toHaveProperty('password');
    const stored = await prisma.usuario.findUniqueOrThrow({ where: { usuario_id: createdId } });
    expect(stored.password_hash.startsWith('$argon2id$')).toBe(true); expect(await argon2.verify(stored.password_hash, password)).toBe(true);
  });
  it('rechaza email duplicado incluso con mayúsculas', async () => {
    await admin.post('/users').send({ email: email.toUpperCase(), password, rol_id: operatorRole }).expect(409);
  });
  it.each([{ email: 'invalid' }, { rol_id: randomUUID() }, { estado: 'INVALIDO' }, { estado: null }, { password: 'short' }, { nombre: 'campo-no-documentado' }])('rechaza creación inválida %j', async (change) => {
    await admin.post('/users').send({ email: `new-${email}`, password, rol_id: operatorRole, ...change }).expect(400);
  });
  it('edita email, rol y estado y confirma la consulta', async () => {
    const changed = await admin.patch(`/users/${createdId}`).send({ email: `edited-${email}`, rol_id: adminRole, estado: 'BLOQUEADO' }).expect(200);
    expect(changed.body).toMatchObject({ email: `edited-${email}`, rol_id: adminRole, estado: 'BLOQUEADO' }); expect(changed.body).not.toHaveProperty('password_hash');
    const listed = await admin.get('/users').expect(200); expect(listed.body.some((item: { email: string }) => item.email === `edited-${email}`)).toBe(true);
  });
  it('rechaza PATCH vacío, rol/estado inválidos, contraseña y correo duplicado', async () => {
    for (const body of [{}, { estado: 'bad' }, { rol_id: randomUUID() }, { password }, { email: null }]) await admin.patch(`/users/${createdId}`).send(body).expect(400);
    await admin.patch(`/users/${createdId}`).send({ email: `admin-${email}` }).expect(409);
  });
  it('401 sin sesión y 403 para cuenta autenticada sin permisos en todos los endpoints', async () => {
    for (const path of ['/users', `/users/${adminId}`, '/roles']) { await request(app.getHttpServer()).get(path).expect(401); await operator.get(path).expect(403); }
    await request(app.getHttpServer()).post('/users').send({}).expect(401); await operator.post('/users').send({}).expect(403);
    await request(app.getHttpServer()).patch(`/users/${adminId}`).send({}).expect(401); await operator.patch(`/users/${adminId}`).send({}).expect(403);
  });
  it('UUID inválido 400, cuenta inexistente 404 y sin DELETE físico', async () => {
    await admin.get('/users/bad').expect(400); await admin.get(`/users/${randomUUID()}`).expect(404); await admin.patch(`/users/${randomUUID()}`).send({ estado: 'ACTIVO' }).expect(404); await admin.delete(`/users/${createdId}`).expect(404);
  });
  it('bloquea escrituras de origen ajeno y mantiene PATCH CORS', async () => {
    await admin.patch(`/users/${createdId}`).set('Origin', 'https://evil.example').send({ estado: 'ACTIVO' }).expect(403);
    const origin = app.get(ConfigService).getOrThrow<string>('FRONTEND_ORIGIN'); const response = await admin.options(`/users/${createdId}`).set('Origin', origin).set('Access-Control-Request-Method', 'PATCH').expect(204);
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
  });
  it('comprueba rol vigente y cierre de sesión para administración', async () => {
    await prisma.usuario.update({ where: { usuario_id: adminId }, data: { rol_id: operatorRole } }); await admin.get('/users').expect(403);
    await prisma.usuario.update({ where: { usuario_id: adminId }, data: { rol_id: adminRole } }); await admin.get('/users').expect(200);
    await admin.post('/auth/logout').expect(204); await admin.get('/users').expect(401);
  });
});
