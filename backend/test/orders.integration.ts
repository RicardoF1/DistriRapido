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
import { OrdersService } from '../src/orders/orders.service';
describe('US-004 HTTP + PostgreSQL', () => {
  let app: INestApplication; let prisma: PrismaClient;
  const agents: Record<string, ReturnType<typeof request.agent>> = {};
  const users: string[] = []; const orders: string[] = []; const clients: string[] = [];
  const valid = { cliente: { nombre: 'Integración US-004', direccion: 'Destino prueba', latitud: -12.065, longitud: -75.204 }, peso_kg: 5.25, volumen_m3: 0.015, ventana_inicio: '2026-10-02T09:00:00-05:00', ventana_fin: '2026-10-02T10:00:00-05:00', prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO' };
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || (!new URL(url).pathname.endsWith('_test') && !/^distrirapido_[a-z0-9_]+_test$/.test(new URL(url).searchParams.get('schema') ?? ''))) throw new Error('Se requiere base o esquema aislado de pruebas.');
    process.env.DATABASE_URL = url; prisma = new PrismaClient();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile(); app = module.createNestApplication(); configureApp(app, app.get(ConfigService).getOrThrow<string>('FRONTEND_ORIGIN')); await app.init();
    for (const nombre of Object.values(ROLE_NAMES)) {
      const role = await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre, descripcion: 'Prueba aislada' } });
      const password = randomBytes(24).toString('hex'); const email = `us004-${randomUUID()}@example.com`;
      const user = await prisma.usuario.create({ data: { email, rol_id: role.rol_id, password_hash: await argon2.hash(password, { type: argon2.argon2id }) } }); users.push(user.usuario_id);
      agents[nombre] = request.agent(app.getHttpServer()); await agents[nombre].post('/auth/login').send({ email, password }).expect(200);
    }
  });
  afterAll(async () => {
    if (app) await app.close();
    if (prisma) { await prisma.pedido.deleteMany({ where: { pedido_id: { in: orders } } }); await prisma.cliente.deleteMany({ where: { cliente_id: { in: clients } } }); await prisma.usuario.deleteMany({ where: { usuario_id: { in: users } } }); await prisma.$disconnect(); }
  });
  it.each([ROLE_NAMES.administrator, ROLE_NAMES.operator])('%s registra pedido con cliente relacionado y valores persistidos', async role => {
    const response = await agents[role].post('/orders').send(valid).expect(201); orders.push(response.body.pedido_id); clients.push(response.body.cliente_id);
    const stored = await prisma.pedido.findUniqueOrThrow({ where: { pedido_id: response.body.pedido_id }, include: { cliente: true } });
    expect(stored.cliente.nombre).toBe(valid.cliente.nombre); expect(stored.cliente.estado).toBe('ACTIVO');
    expect(stored.peso_kg.toString()).toBe('5.25'); expect(stored.volumen_m3?.toString()).toBe('0.015'); expect(stored.estado).toBe('PENDIENTE'); expect(stored.ventana_inicio.toISOString()).toBe('2026-10-02T14:00:00.000Z');
    expect(response.body).not.toHaveProperty('cliente'); expect(JSON.stringify(response.body)).not.toMatch(/password|hash|accessToken/);
  });
  it.each(['cliente', 'peso_kg', 'ventana_inicio', 'ventana_fin', 'prioridad', 'tipo_producto'])('rechaza falta de %s sin persistir', async field => {
    const body: Record<string, unknown> = { ...valid }; delete body[field];
    const before = await prisma.cliente.count(); await agents[ROLE_NAMES.operator].post('/orders').send(body).expect(400); expect(await prisma.cliente.count()).toBe(before);
  });
  it.each([undefined, null])('persiste volumen desconocido como NULL (%s) y conserva descripción/referencia', async volumen_m3 => {
    const response = await agents[ROLE_NAMES.operator].post('/orders').send({ ...valid, volumen_m3, descripcion_carga: 'Costal de ropa', cliente: { ...valid.cliente, referencia: 'Puerta azul' } }).expect(201);
    orders.push(response.body.pedido_id); clients.push(response.body.cliente_id);
    const stored = await prisma.pedido.findUniqueOrThrow({ where: { pedido_id: response.body.pedido_id }, include: { cliente: true } });
    expect(stored.volumen_m3).toBeNull(); expect(response.body.volumen_m3).toBeNull(); expect(stored.descripcion_carga).toBe('Costal de ropa'); expect(stored.cliente.referencia).toBe('Puerta azul');
    expect(stored.cliente.latitud.toString()).toBe('-12.065'); expect(stored.cliente.longitud.toString()).toBe('-75.204');
  });
  it.each([
    { cliente: { ...valid.cliente, nombre: '' } }, { cliente: { ...valid.cliente, direccion: ' ' } }, { cliente: { ...valid.cliente, latitud: 90.000001 } }, { cliente: { ...valid.cliente, longitud: -180.000001 } },
    { cliente: { ...valid.cliente, latitud: -12.1234567 } }, { cliente: { ...valid.cliente, latitud: '-12' } },
    { peso_kg: 0 }, { peso_kg: -1 }, { peso_kg: 100000000 }, { peso_kg: 1.001 }, { volumen_m3: 0 }, { volumen_m3: -1 }, { volumen_m3: 10000000 }, { volumen_m3: 0.0001 },
    { cliente: { ...valid.cliente, latitud: undefined } }, { cliente: { ...valid.cliente, longitud: undefined } }, { ventana_fin: '2026-10-02T08:00:00-05:00' },
    { ventana_inicio: 'invalid' }, { ventana_inicio: '2026-02-30T09:00:00Z' }, { ventana_inicio: '2026-10-02T09:00:00' }, { ventana_fin: valid.ventana_inicio },
    { prioridad: 'ALTA' }, { tipo_producto: 'OTRO' }, { estado: 'ENTREGADO' }, { cliente_id: randomUUID() },
    { cliente: { ...valid.cliente, latitud: 1e-7 } }, { cliente: { ...valid.cliente, longitud: -1e-7 } }, { peso_kg: 1e-7 },
  ])('rechaza formatos, rangos, enums o atributos no permitidos %#', async change => {
    const before = await prisma.pedido.count(); await agents[ROLE_NAMES.operator].post('/orders').send({ ...valid, ...change }).expect(400); expect(await prisma.pedido.count()).toBe(before);
  });
  it('mantiene 401/403 y protección de origen', async () => {
    await request(app.getHttpServer()).post('/orders').send(valid).expect(401);
    for (const role of [ROLE_NAMES.driver, ROLE_NAMES.auditor]) await agents[role].post('/orders').send(valid).expect(403);
    await agents[ROLE_NAMES.operator].post('/orders').set('Origin', 'https://evil.example').send(valid).expect(403);
  });
  it('transacción revierte Cliente si PostgreSQL rechaza Pedido', async () => {
    const before = await prisma.cliente.count();
    await expect(app.get(OrdersService).create({ ...valid, prioridad: 'INVALIDA' })).rejects.toThrow();
    expect(await prisma.cliente.count()).toBe(before);
  });
  it('US-005 consulta PostgreSQL: búsqueda, filtros, paginación y detalle', async () => {
    const marker = `consulta-${randomUUID()}`;
    const seeded: string[] = [];
    for (let index = 0; index < 3; index++) {
      const response = await agents[ROLE_NAMES.operator].post('/orders').send({ ...valid, cliente: { ...valid.cliente, nombre: `${marker} Mantaro ${index}`, direccion: `${marker} Giraldez` }, volumen_m3: null, prioridad: index === 0 ? 'ESTANDAR' : 'EXPRESS', tipo_producto: index === 0 ? 'NO_PERECEDERO' : 'PERECEDERO' }).expect(201);
      orders.push(response.body.pedido_id); clients.push(response.body.cliente_id); seeded.push(response.body.pedido_id);
    }
    for (const search of [`${marker} Mantaro`, `${marker} Giraldez`]) {
      const response = await agents[ROLE_NAMES.operator].get('/orders').query({ search }).expect(200);
      expect(response.body.total).toBe(3); expect(response.body.items).toHaveLength(3);
      expect(response.body.items[0].cliente.nombre).toContain(marker); expect(response.body.items[0].volumen_m3).toBeNull();
    }
    for (const filter of [{ estado: 'PENDIENTE' }, { prioridad: 'EXPRESS' }, { tipo_producto: 'PERECEDERO' }, { prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO', estado: 'PENDIENTE' }]) {
      const response = await agents[ROLE_NAMES.administrator].get('/orders').query({ search: marker, ...filter }).expect(200);
      expect(response.body.total).toBe('prioridad' in filter || 'tipo_producto' in filter ? 2 : 3);
    }
    const first = await agents[ROLE_NAMES.administrator].get('/orders').query({ search: marker, page: 1, pageSize: 2 }).expect(200);
    const second = await agents[ROLE_NAMES.administrator].get('/orders').query({ search: marker, page: 2, pageSize: 2 }).expect(200);
    expect(first.body).toMatchObject({ total: 3, page: 1, pageSize: 2 }); expect(first.body.items).toHaveLength(2); expect(second.body.items).toHaveLength(1);
    expect(new Set([...first.body.items, ...second.body.items].map(item => item.pedido_id)).size).toBe(3);
    const exact = await agents[ROLE_NAMES.operator].get('/orders').query({ search: seeded[0] }).expect(200); expect(exact.body.total).toBe(1);
    const empty = await agents[ROLE_NAMES.operator].get('/orders').query({ search: randomUUID() }).expect(200); expect(empty.body.items).toEqual([]); expect(empty.body.total).toBe(0);
    const detail = await agents[ROLE_NAMES.operator].get(`/orders/${seeded[0]}`).expect(200); expect(detail.body.cliente.direccion).toContain('Giraldez'); expect(detail.body.volumen_m3).toBeNull();
  });
  it('US-005 rechaza query/UUID inválidos y controla autorización', async () => {
    for (const query of [{ page: -1 }, { pageSize: 101 }, { estado: 'INVENTADO' }]) await agents[ROLE_NAMES.operator].get('/orders').query(query).expect(400);
    await agents[ROLE_NAMES.operator].get('/orders/invalid').expect(400);
    await agents[ROLE_NAMES.operator].get(`/orders/${randomUUID()}`).expect(404);
    for (const path of ['/orders', `/orders/${orders[0]}`]) {
      await request(app.getHttpServer()).get(path).expect(401);
      for (const role of [ROLE_NAMES.driver, ROLE_NAMES.auditor]) await agents[role].get(path).expect(403);
    }
  });
  it('US-005 consulta sin habilitar edición ni eliminación', async () => {
    await agents[ROLE_NAMES.administrator].get('/orders').expect(200);
    await agents[ROLE_NAMES.administrator].get(`/orders/${orders[0]}`).expect(200);
    await agents[ROLE_NAMES.administrator].patch(`/orders/${orders[0]}`).send({}).expect(404);
    await agents[ROLE_NAMES.administrator].delete(`/orders/${orders[0]}`).expect(404);
  });
});
