import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { UsersService } from '../src/users/users.service';
import { ROLE_NAMES } from '../src/roles/roles';

// US-019 / RF-016: seguimiento operativo HTTP + PostgreSQL aislado, con datos sintéticos.
describe('US-019 seguimiento operativo HTTP + PostgreSQL aislado', () => {
  let app: INestApplication; let prisma: PrismaClient;
  const password = randomBytes(24).toString('hex');
  const users: string[] = []; const agents: Partial<Record<string, request.Agent>> = {};
  const drivers: string[] = []; const orders: string[] = []; const routes: string[] = []; const alternatives: string[] = [];
  let vehicle = ''; let client = ''; let plan = ''; let execution = ''; let plate = '';
  let baseline: { routes: Record<string, number>; deliveries: Record<string, number>; incidents: number };
  let ip = 1;
  const get = (role: string, path: string) => agents[role]!.get(path).set('X-Forwarded-For', `203.0.113.${ip++ % 250 + 1}`);
  const admin = (path: string) => get(ROLE_NAMES.administrator, path);

  async function seedRoute(estado: 'GENERADA' | 'ASIGNADA' | 'EN_CURSO' | 'COMPLETADA', driver: string | null, assignedAt: Date | null, stops: ('PENDIENTE' | 'ENTREGADA' | 'NO_ENTREGADA')[], index: number) {
    const alternative = await prisma.alternativaRuta.create({ data: { ejecucion_id: execution, numero: index } });
    alternatives.push(alternative.alternativa_id);
    const stopOrders: string[] = [];
    for (let position = 0; position < stops.length; position++) {
      const order = await prisma.pedido.create({ data: { cliente_id: client, peso_kg: 1, ventana_inicio: new Date('2030-01-01T12:00:00Z'), ventana_fin: new Date('2030-01-01T15:00:00Z'), prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', estado: 'EN_RUTA' } });
      orders.push(order.pedido_id); stopOrders.push(order.pedido_id);
    }
    const now = new Date();
    const route = await prisma.ruta.create({
      data: {
        alternativa_id: alternative.alternativa_id, estado, conductor_id: driver, asignado_en: assignedAt,
        iniciado_en: estado === 'EN_CURSO' || estado === 'COMPLETADA' ? assignedAt : null,
        finalizado_en: estado === 'COMPLETADA' ? assignedAt : null,
        versiones: { create: { numero: 1, vehiculo_id: vehicle, distancia_m: 1000, duracion_s: 120, resultado: {}, input_hash: 'c'.repeat(64), paradas: { create: stops.map((state, position) => ({
          pedido_id: stopOrders[position], secuencia: position + 1, datos: { direccion: `Dirección sintética ${index}-${position + 1}` }, estado_entrega: state,
          causa_no_entrega: state === 'NO_ENTREGADA' ? 'Cliente ausente' : null, atendido_en: state === 'PENDIENTE' ? null : now,
        })) } } },
      },
      include: { versiones: { include: { paradas: { orderBy: { secuencia: 'asc' } } } } },
    });
    routes.push(route.ruta_id);
    return route;
  }

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || (!new URL(url).pathname.endsWith('_test') && !/^distrirapido_[a-z0-9_]+_test$/.test(new URL(url).searchParams.get('schema') ?? ''))) throw new Error('Requiere base o esquema aislado de pruebas.');
    process.env.DATABASE_URL = url; process.env.JWT_SECRET = randomBytes(48).toString('hex');
    prisma = new PrismaClient();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');
    configureApp(app, 'http://localhost:5173'); await app.init();
    for (const nombre of Object.values(ROLE_NAMES)) {
      const role = await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre, descripcion: 'Prueba aislada' } });
      const account = await app.get(UsersService).create({ email: `ops-${randomBytes(10).toString('hex')}@example.test`, password, rol_id: role.rol_id, estado: 'ACTIVO' });
      users.push(account.usuario_id);
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login').set('X-Forwarded-For', `203.0.113.${ip++}`).send({ email: account.email, password }).expect(200);
      agents[nombre] = agent;
    }
    baseline = (await admin('/operations/summary').expect(200)).body;
    for (const name of ['Ana Operativa', 'Bruno Sintético']) drivers.push((await prisma.conductor.create({ data: { nombre_completo: `${name} ${randomBytes(3).toString('hex')}`, dni: randomBytes(8).toString('hex'), licencia_categoria: 'PRUEBA', telefono: 'SIN-DATO-REAL' } })).conductor_id);
    plate = `OP${randomBytes(4).toString('hex')}`.toUpperCase().slice(0, 15);
    vehicle = (await prisma.vehiculo.create({ data: { placa: plate, tipo: 'PRUEBA', capacidad_carga_kg: 100, consumo_km_l: 10, factor_emision_kg_co2_km: 0.1, anio_fabricacion: 2020 } })).vehiculo_id;
    client = (await prisma.cliente.create({ data: { nombre: 'Cliente sintético', direccion: 'Sin dirección real', latitud: 0, longitud: 0 } })).cliente_id;
    const planning = await prisma.planificacion.create({
      data: { creado_por: users[0], etiqueta: 'Plan sintético seguimiento', versiones: { create: { numero: 1, snapshot: {}, input_hash: 'a'.repeat(64), ejecuciones: { create: { actor_id: users[0], idempotency_key: randomUUID(), request_hash: 'b'.repeat(64), estado: 'COMPLETADA', owner_token: randomUUID(), vence_en: new Date(Date.now() + 60000) } } } } },
      include: { versiones: { include: { ejecuciones: true } } },
    });
    plan = planning.planificacion_id; execution = planning.versiones[0].ejecuciones[0].ejecucion_id;
    // 2030-03-10 10:00 Lima = 15:00 UTC; 2030-03-12 23:30 Lima = 2030-03-13 04:30 UTC.
    const inProgress = await seedRoute('EN_CURSO', drivers[0], new Date('2030-03-10T15:00:00Z'), ['ENTREGADA', 'NO_ENTREGADA', 'PENDIENTE'], 1);
    await seedRoute('COMPLETADA', drivers[1], new Date('2030-03-13T04:30:00Z'), ['ENTREGADA', 'ENTREGADA'], 2);
    await seedRoute('ASIGNADA', drivers[1], new Date('2030-03-15T15:00:00Z'), ['PENDIENTE'], 3);
    await seedRoute('GENERADA', null, null, ['PENDIENTE'], 4);
    await prisma.incidenciaEntrega.create({ data: { parada_id: inProgress.versiones[0].paradas[1].parada_id, conductor_id: drivers[0], tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende' } });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (!prisma) return;
    await prisma.incidenciaEntrega.deleteMany({ where: { conductor_id: { in: drivers } } });
    await prisma.paradaRuta.deleteMany({ where: { ruta_version: { ruta_id: { in: routes } } } });
    await prisma.rutaVersion.deleteMany({ where: { ruta_id: { in: routes } } });
    await prisma.ruta.deleteMany({ where: { ruta_id: { in: routes } } });
    await prisma.alternativaRuta.deleteMany({ where: { alternativa_id: { in: alternatives } } });
    if (plan) {
      await prisma.ejecucionCalculo.deleteMany({ where: { version: { planificacion_id: plan } } });
      await prisma.planificacionVersion.deleteMany({ where: { planificacion_id: plan } });
      await prisma.planificacion.delete({ where: { planificacion_id: plan } });
    }
    await prisma.pedido.deleteMany({ where: { pedido_id: { in: orders } } });
    if (client) await prisma.cliente.delete({ where: { cliente_id: client } });
    if (vehicle) await prisma.vehiculo.delete({ where: { vehiculo_id: vehicle } });
    await prisma.conductor.deleteMany({ where: { conductor_id: { in: drivers } } });
    await prisma.usuario.deleteMany({ where: { usuario_id: { in: users } } });
    await prisma.$disconnect();
  });

  type Item = { ruta_id: string; estado: string; conductor: { conductor_id: string } };
  const mine = (body: { items: Item[] }) => body.items.filter(item => routes.includes(item.ruta_id));

  it('Administrador y Operador consultan; Conductor y Auditor no', async () => {
    await get(ROLE_NAMES.operator, '/operations/routes').expect(200);
    await get(ROLE_NAMES.driver, '/operations/routes').expect(403);
    await get(ROLE_NAMES.auditor, '/operations/summary').expect(403);
    await request(app.getHttpServer()).get('/operations/routes').set('X-Forwarded-For', '203.0.113.251').expect(401);
  });

  it('muestra solo rutas en operación, con progreso e incidencias', async () => {
    const body = (await admin(`/operations/routes?search=${plate}&pageSize=50`).expect(200)).body;
    const items = mine(body);
    expect(items.map((item: { estado: string }) => item.estado).sort()).toEqual(['ASIGNADA', 'COMPLETADA', 'EN_CURSO']);
    const current = items.find((item: { estado: string }) => item.estado === 'EN_CURSO');
    expect(current).toMatchObject({ deliveries: { total: 3, delivered: 1, not_delivered: 1, pending: 1, percentage: 66.67 }, incidents: 1, version: { vehiculo: { placa: plate } } });
  });

  it('el resumen suma las rutas, entregas e incidencias en operación', async () => {
    const summary = (await admin('/operations/summary').expect(200)).body;
    expect(summary.routes.EN_CURSO - baseline.routes.EN_CURSO).toBe(1);
    expect(summary.routes.COMPLETADA - baseline.routes.COMPLETADA).toBe(1);
    expect(summary.routes.ASIGNADA - baseline.routes.ASIGNADA).toBe(1);
    expect(summary.deliveries.ENTREGADA - baseline.deliveries.ENTREGADA).toBe(3);
    expect(summary.deliveries.NO_ENTREGADA - baseline.deliveries.NO_ENTREGADA).toBe(1);
    expect(summary.deliveries.PENDIENTE - baseline.deliveries.PENDIENTE).toBe(2);
    expect(summary.incidents - baseline.incidents).toBe(1);
  });

  it.each([
    ['estado=COMPLETADA', ['COMPLETADA']],
    ['estado_entrega=NO_ENTREGADA', ['EN_CURSO']],
    ['estado_entrega=PENDIENTE', ['ASIGNADA', 'EN_CURSO']],
    ['con_incidencias=true', ['EN_CURSO']],
    ['estado_entrega=ENTREGADA&con_incidencias=true', ['EN_CURSO']],
    ['desde=2030-03-12&hasta=2030-03-12', ['COMPLETADA']],
    ['desde=2030-03-10&hasta=2030-03-10', ['EN_CURSO']],
  ])('aplica el filtro %s', async (filter, expected) => {
    const body = (await admin(`/operations/routes?search=${plate}&pageSize=50&${filter}`).expect(200)).body;
    expect(mine(body).map((item: { estado: string }) => item.estado).sort()).toEqual(expected);
  });

  it('filtra por conductor', async () => {
    const body = (await admin(`/operations/routes?conductor_id=${drivers[1]}&pageSize=50`).expect(200)).body;
    expect(body.items.every((item: { conductor: { conductor_id: string } }) => item.conductor.conductor_id === drivers[1])).toBe(true);
    expect(mine(body)).toHaveLength(2);
  });

  it('informa que no hay resultados sin error', async () => {
    const body = (await admin(`/operations/routes?search=${plate}&estado=ASIGNADA&estado_entrega=NO_ENTREGADA`).expect(200)).body;
    expect(body).toMatchObject({ items: [], total: 0 });
  });

  it('rechaza filtros no permitidos con un mensaje por filtro', async () => {
    const body = (await admin('/operations/routes?estado=GENERADA&desde=2030-02-30').expect(400)).body;
    expect(body.message).toEqual(expect.arrayContaining(['estado: usa ASIGNADA, EN_CURSO o COMPLETADA.']));
    await admin('/operations/routes?desde=2030-02-30').expect(400);
    await admin('/operations/routes?desde=2030-03-12&hasta=2030-03-10').expect(400);
    await admin('/operations/routes?orden=asc').expect(400);
  });

  it('detalla entregas, causas e incidencias y no expone rutas en planificación', async () => {
    const detail = (await admin(`/operations/routes/${routes[0]}`).expect(200)).body;
    expect(detail.stops.map((stop: { estado_entrega: string }) => stop.estado_entrega)).toEqual(['ENTREGADA', 'NO_ENTREGADA', 'PENDIENTE']);
    expect(detail.stops[1]).toMatchObject({ direccion: 'Dirección sintética 1-2', causa_no_entrega: 'Cliente ausente', incidencias: [{ tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende' }] });
    await admin(`/operations/routes/${routes[3]}`).expect(404);
    await admin(`/operations/routes/${randomUUID()}`).expect(404);
  });
});
