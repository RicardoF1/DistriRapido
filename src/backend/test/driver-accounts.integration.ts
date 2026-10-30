import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { UsersService } from '../src/users/users.service';
import { DriverAccountsService } from '../src/drivers/driver-accounts.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ROLE_NAMES } from '../src/roles/roles';

describe('Cuentas y vínculos HTTP + PostgreSQL aislado', () => {
  let app: INestApplication; let p: PrismaClient; let users: UsersService; let driverRole: string; let adminRole: string;
  const ids = new Set<string>(); const drivers: string[] = []; const agents: Record<string, ReturnType<typeof request.agent>> = {};
  const password = randomBytes(24).toString('hex'); let client = 1;
  const email = () => `account-${randomBytes(10).toString('hex')}@example.test`;
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || (!new URL(url).pathname.endsWith('_test') && !/^distrirapido_[a-z0-9_]+_test$/.test(new URL(url).searchParams.get('schema') ?? ''))) throw new Error('Requiere esquema o base aislada.');
    process.env.DATABASE_URL = url; process.env.JWT_SECRET = randomBytes(48).toString('hex'); p = new PrismaClient();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile(); app = module.createNestApplication(); app.getHttpAdapter().getInstance().set('trust proxy', 'loopback'); configureApp(app, 'http://localhost:5173'); await app.init(); users = app.get(UsersService);
    for (const name of Object.values(ROLE_NAMES)) {
      const role = await p.rol.upsert({ where: { nombre: name }, update: {}, create: { nombre: name, descripcion: 'Prueba aislada' } });
      if (name === ROLE_NAMES.driver) driverRole = role.rol_id; if (name === ROLE_NAMES.administrator) adminRole = role.rol_id;
      const account = await users.create({ email: email(), password, rol_id: role.rol_id }); ids.add(account.usuario_id);
      const agent = request.agent(app.getHttpServer()); await agent.post('/auth/login').send({ email: account.email, password }).expect(200); agents[name] = agent;
    }
  });
  afterAll(async () => {
    if (app) await app.close();
    if (p) {
      const linked = await p.conductor.findMany({ where: { conductor_id: { in: drivers } }, select: { usuario_id: true } }); linked.forEach(x => { if (x.usuario_id) ids.add(x.usuario_id); });
      await p.conductor.deleteMany({ where: { conductor_id: { in: drivers } } });
      await p.usuario.deleteMany({ where: { usuario_id: { in: [...ids] } } }); await p.$disconnect();
    }
  });
  async function driver() { const d = await p.conductor.create({ data: { nombre_completo: 'Prueba de cuentas aislada', dni: randomBytes(8).toString('hex'), licencia_categoria: 'PRUEBA', telefono: 'SIN-DATO-REAL' } }); drivers.push(d.conductor_id); return d; }
  async function account() { const a = await users.create({ email: email(), password, rol_id: driverRole }); ids.add(a.usuario_id); return a; }
  const put = (id: string, data: object, role: string = ROLE_NAMES.administrator) => agents[role].put(`/drivers/${id}/account`).set('Origin', 'http://localhost:5173').set('X-Forwarded-For', `192.0.2.${client++}`).send(data);
  const post = (id: string, address: string, role: string = ROLE_NAMES.administrator) => agents[role].post(`/drivers/${id}/account`).set('Origin', 'http://localhost:5173').set('X-Forwarded-For', `192.0.2.${client++}`).send({ email: address, password });
  it('crea y vincula sin dejar contraseña en respuesta, y la cuenta puede iniciar sesión', async () => {
    const d = await driver(); const address = email(); const result = await post(d.conductor_id, address).expect(201); ids.add(result.body.cuenta.usuario_id);
    expect(result.body.cuenta).toMatchObject({ email: address, estado: 'ACTIVO' }); expect(JSON.stringify(result.body)).not.toMatch(/password|hash/);
    const login = request.agent(app.getHttpServer()); await login.post('/auth/login').send({ email: address, password }).expect(200);
    expect((await login.get('/driver/me').expect(200)).body.conductor_id).toBe(d.conductor_id);
  });
  it('correo duplicado y cuenta ya vinculada no crean filas adicionales', async () => {
    const a = await account(); const d = await driver(); const before = await p.usuario.count();
    await post(d.conductor_id, a.email).expect(409); expect(await p.usuario.count()).toBe(before);
    await put(d.conductor_id, { usuario_id: a.usuario_id, expected_usuario_id: null }).expect(200);
    await post(d.conductor_id, email()).expect(409); expect(await p.usuario.count()).toBe(before);
  });
  it('dos conductores compitiendo por una cuenta: solo un vínculo puede persistir', async () => {
    const a = await account(); const first = await driver(); const second = await driver();
    const results = await Promise.all([first, second].map(d => put(d.conductor_id, { usuario_id: a.usuario_id, expected_usuario_id: null })));
    expect(results.map(r => r.status).sort()).toEqual([200, 409]); expect(await p.conductor.count({ where: { usuario_id: a.usuario_id } })).toBe(1);
  });
  it('dos altas simultáneas sobre la misma ficha: una cuenta creada y ningún huérfano', async () => {
    const d = await driver(); const first = email(); const second = email(); const before = await p.usuario.count();
    const results = await Promise.all([post(d.conductor_id, first), post(d.conductor_id, second)]);
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    const created = await p.usuario.findMany({ where: { email: { in: [first, second] } } }); created.forEach(a => ids.add(a.usuario_id));
    expect(created).toHaveLength(1); expect(await p.usuario.count()).toBe(before + 1);
    expect((await p.conductor.findUniqueOrThrow({ where: { conductor_id: d.conductor_id } })).usuario_id).toBe(created[0].usuario_id);
  });
  it('revierte la cuenta insertada si falla el cambio condicional del vínculo', async () => {
    const d = await driver(); const address = email(); const before = await p.usuario.count();
    // Inject a lost compare-and-set after a real INSERT. The real PG transaction must roll it back.
    const real = p;
    const wrapper = { $transaction: (operation: (tx: unknown) => Promise<unknown>) => real.$transaction(tx => operation(new Proxy(tx, { get(target, key) { if (key === 'conductor') return new Proxy(target.conductor, { get(model, method) { return method === 'updateMany' ? async () => ({ count: 0 }) : Reflect.get(model, method); } }); return Reflect.get(target, key); } }))) };
    const service = new DriverAccountsService(wrapper as unknown as PrismaService, users);
    await expect(service.create(d.conductor_id, { email: address, password })).rejects.toThrow('vínculo cambió');
    expect(await p.usuario.count()).toBe(before); expect(await p.usuario.findUnique({ where: { email: address } })).toBeNull();
  });
  it('reemplazo solo confirmado, detecta vínculo obsoleto y mantiene cuenta anterior', async () => {
    const first = await account(); const second = await account(); const third = await account(); const d = await driver();
    await put(d.conductor_id, { usuario_id: first.usuario_id, expected_usuario_id: null }).expect(200);
    await put(d.conductor_id, { usuario_id: second.usuario_id, expected_usuario_id: first.usuario_id }).expect(409);
    await put(d.conductor_id, { usuario_id: second.usuario_id, expected_usuario_id: first.usuario_id, confirm_replacement: true }).expect(200);
    await put(d.conductor_id, { usuario_id: third.usuario_id, expected_usuario_id: first.usuario_id, confirm_replacement: true }).expect(409);
    expect(await p.usuario.findUnique({ where: { usuario_id: first.usuario_id } })).not.toBeNull();
  });
  it('opciones excluyen otras cuentas ocupadas y no permiten inactivas', async () => {
    const a = await account(); const occupied = await driver(); const free = await driver(); await put(occupied.conductor_id, { usuario_id: a.usuario_id, expected_usuario_id: null }).expect(200);
    const response = await agents[ROLE_NAMES.administrator].get('/drivers/account-options').query({ conductor_id: free.conductor_id, search: a.email }).expect(200); expect(response.body.items).toHaveLength(0);
    const inactive = await account(); await p.usuario.update({ where: { usuario_id: inactive.usuario_id }, data: { estado: 'INACTIVO' } });
    await put(free.conductor_id, { usuario_id: inactive.usuario_id, expected_usuario_id: null }).expect(400);
  });
  it('operador ve booleano pero no datos de cuenta y no puede mutar usuario_id', async () => {
    const a = await account(); const d = await driver(); await put(d.conductor_id, { usuario_id: a.usuario_id, expected_usuario_id: null }).expect(200);
    const body = (await agents[ROLE_NAMES.operator].get('/drivers/' + d.conductor_id).expect(200)).body;
    expect(body.cuenta_vinculada).toBe(true); expect(body).not.toHaveProperty('cuenta'); expect(body).not.toHaveProperty('usuario_id');
    await agents[ROLE_NAMES.operator].patch('/drivers/' + d.conductor_id).set('Origin', 'http://localhost:5173').send({ usuario_id: null }).expect(403);
    await agents[ROLE_NAMES.administrator].patch('/drivers/' + d.conductor_id).set('Origin', 'http://localhost:5173').send({ usuario_id: null }).expect(400);
    await put(d.conductor_id, { usuario_id: a.usuario_id, expected_usuario_id: a.usuario_id }, ROLE_NAMES.operator).expect(403);
  });
  it('no cambia rol de cuenta vinculada y preserva la contraseña al editar ficha', async () => {
    const a = await account(); const d = await driver(); const hash = (await p.usuario.findUniqueOrThrow({ where: { usuario_id: a.usuario_id } })).password_hash;
    await put(d.conductor_id, { usuario_id: a.usuario_id, expected_usuario_id: null }).expect(200);
    await agents[ROLE_NAMES.administrator].patch('/users/' + a.usuario_id).set('Origin', 'http://localhost:5173').send({ rol_id: adminRole }).expect(409);
    await agents[ROLE_NAMES.operator].patch('/drivers/' + d.conductor_id).set('Origin', 'http://localhost:5173').send({ nombre_completo: 'Ficha editada' }).expect(200);
    expect((await p.usuario.findUniqueOrThrow({ where: { usuario_id: a.usuario_id } })).password_hash).toBe(hash);
    // Stage 2 now exists, but an empty request must still never reset credentials.
    await agents[ROLE_NAMES.administrator].post(`/drivers/${d.conductor_id}/account/reset-password`).send({}).expect(400);
  });
  it('cambio de rol concurrente con vínculo no deja asociación incompatible', async () => {
    const a = await account(); const d = await driver();
    await Promise.all([put(d.conductor_id, { usuario_id: a.usuario_id, expected_usuario_id: null }), agents[ROLE_NAMES.administrator].patch('/users/' + a.usuario_id).set('Origin', 'http://localhost:5173').send({ rol_id: adminRole })]);
    const stored = await p.conductor.findUniqueOrThrow({ where: { conductor_id: d.conductor_id }, include: { usuario: { include: { rol: true } } } });
    if (stored.usuario) expect(stored.usuario.rol.nombre).toBe(ROLE_NAMES.driver);
  });
});
