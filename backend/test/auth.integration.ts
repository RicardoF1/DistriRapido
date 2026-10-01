import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { ROLE_NAMES } from '../src/roles/roles';

describe('US-001 / US-002 HTTP + PostgreSQL real', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let roleId: string;
  let userId: string;
  let token: string;
  let frontendOrigin: string;
  const email = `${randomUUID()}@example.com`;
  const password = randomBytes(24).toString('hex');
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || (!new URL(url).pathname.endsWith('_test') && !/^distrirapido_[a-z0-9_]+_test$/.test(new URL(url).searchParams.get('schema') ?? ''))) throw new Error('TEST_DATABASE_URL requiere una base _test o un esquema aislado distrirapido_*_test.');
    process.env.DATABASE_URL = url;
    process.env.JWT_SECRET = randomBytes(48).toString('hex');
    prisma = new PrismaClient();
    const rol = await prisma.rol.upsert({ where: { nombre: ROLE_NAMES.administrator }, update: {}, create: { nombre: ROLE_NAMES.administrator, descripcion: 'Pruebas US-001' } }); roleId = rol.rol_id;
    const user = await prisma.usuario.create({ data: { email, rol_id: roleId, password_hash: await argon2.hash(password, { type: argon2.argon2id }) } }); userId = user.usuario_id;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile(); app = module.createNestApplication();
    frontendOrigin = app.get(ConfigService).getOrThrow<string>('FRONTEND_ORIGIN');
    configureApp(app, frontendOrigin); await app.init();
  });
  afterAll(async () => {
    if (app) await app.close();
    if (prisma) { if (userId) await prisma.usuario.delete({ where: { usuario_id: userId } }); await prisma.$disconnect(); }
  });
  it('login válido persiste identidad y genera acceso protegido', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({ email: ` ${email.toUpperCase()} `, password }).expect(200);
    expect(response.body.user).toMatchObject({ usuario_id: userId, email, rol: { nombre: ROLE_NAMES.administrator } });
    expect(JSON.stringify(response.body)).not.toContain('password_hash'); expect(response.headers['cache-control']).toBe('no-store'); token = response.body.accessToken;
    const me = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200); expect(me.body.email).toBe(email);
  });
  it('contraseña incorrecta y cuenta inexistente tienen el mismo error', async () => {
    const wrong = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'incorrect' }).expect(401);
    const missing = await request(app.getHttpServer()).post('/auth/login').send({ email: 'missing@example.com', password }).expect(401);
    expect(wrong.body.message).toBe(missing.body.message);
  });
  it.each(['INACTIVO', 'BLOQUEADO'])('impide login y acceso con cuenta %s', async (estado) => {
    await prisma.usuario.update({ where: { usuario_id: userId }, data: { estado } });
    await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(401);
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    await prisma.usuario.update({ where: { usuario_id: userId }, data: { estado: 'ACTIVO' } });
  });
  it('rechaza datos y propiedades inesperadas', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'bad', password: '' }).expect(400);
    await request(app.getHttpServer()).post('/auth/login').send({ email, password, rol: 'Administrador' }).expect(400);
  });
  it('protege identidad sin token y con token manipulado', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer tampered').expect(401);
  });
  it('mantiene integridad por CHECK, UNIQUE y FK', async () => {
    await expect(prisma.usuario.update({ where: { usuario_id: userId }, data: { estado: 'INVALIDO' } })).rejects.toThrow();
    await expect(prisma.usuario.create({ data: { email, rol_id: roleId, password_hash: 'not-used' } })).rejects.toThrow();
    await expect(prisma.usuario.create({ data: { email: 'fk@example.com', rol_id: randomUUID(), password_hash: 'not-used' } })).rejects.toThrow();
  });
  it('configura CORS solo para el origen permitido', async () => {
    const allowed = await request(app.getHttpServer()).options('/auth/login').set('Origin', frontendOrigin).set('Access-Control-Request-Method', 'POST').expect(204);
    expect(allowed.headers['access-control-allow-origin']).toBe(frontendOrigin);
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const other = await request(app.getHttpServer()).options('/auth/login').set('Origin', 'http://other.example').set('Access-Control-Request-Method', 'POST');
    expect(other.headers['access-control-allow-origin']).not.toBe('http://other.example');
  });
  it('cookie persiste identidad en nuevas solicitudes y logout impide acceso posterior', async () => {
    const browser = request.agent(app.getHttpServer());
    const response = await browser.post('/auth/login').set('Origin', frontendOrigin).send({ email, password }).expect(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const cookie = cookies.find((item) => item.startsWith('distrirapido_session_v2=') && !item.startsWith('distrirapido_session_v2=;'))!;
    expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=Lax'); expect(cookie).toContain('Path=/;');
    const first = await browser.get('/auth/me').expect(200);
    const reloaded = await browser.get('/auth/me').expect(200);
    expect(reloaded.body.email).toBe(email); expect(reloaded.body.expiresAt).toBe(first.body.expiresAt);
    expect(first.body.expiresAt).toBeGreaterThan(Date.now());
    const logout = await browser.post('/auth/logout').set('Origin', frontendOrigin).expect(204);
    expect((logout.headers['set-cookie'] as unknown as string[])[0]).toContain('Expires=Thu, 01 Jan 1970');
    await browser.get('/auth/me').expect(401);
    await browser.post('/auth/logout').expect(204);
    // Bearer compatible con Swagger: eliminación del cliente, sin revocación global del JWT.
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
  });
  it('cookie manipulada y JWT expirado se rechazan', async () => {
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', 'distrirapido_session=tampered').expect(401);
    const expired = await app.get(JwtService).signAsync({ sub: userId }, { issuer: 'distrirapido', audience: 'distrirapido-web', algorithm: 'HS256', expiresIn: -1 });
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', `distrirapido_session=${expired}`).expect(401);
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${expired}`).expect(401);
  });
  it('migra cookie antigua sin cambiar JWT/caducidad y permite /users; /me normal no reemite cookie', async () => {
    const browser = request.agent(app.getHttpServer());
    const migrated = await browser.get('/auth/me').set('Cookie', `distrirapido_session=${token}`).expect(200);
    const cookies = migrated.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((item) => item.startsWith(`distrirapido_session_v2=${token};`) && item.includes('Path=/;'))).toBe(true);
    await browser.get('/users').expect(200);
    const normal = await browser.get('/auth/me').expect(200); expect(normal.body.expiresAt).toBe(migrated.body.expiresAt); expect(normal.headers['set-cookie']).toBeUndefined();
    await browser.post('/auth/logout').expect(204); await browser.get('/users').expect(401);
  });
  it('origen no autorizado no puede crear ni eliminar sesión', async () => {
    await request(app.getHttpServer()).post('/auth/login').set('Origin', 'https://evil.example').send({ email, password }).expect(403);
    await request(app.getHttpServer()).post('/auth/logout').set('Origin', 'https://evil.example').expect(403);
    await request(app.getHttpServer()).post('/auth/logout').set('Sec-Fetch-Site', 'cross-site').expect(403);
  });
  it('limita intentos repetidos', async () => {
    let limited = false;
    for (let count = 0; count < 12; count++) {
      const response = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'wrong' });
      if (response.status === 429) { limited = true; break; }
    }
    expect(limited).toBe(true);
  });
});
