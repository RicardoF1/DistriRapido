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

// US-023 / RF-021: historial HTTP + PostgreSQL aislado. Fechas propias (agosto de 2032)
// y una placa única, para no interferir con los datos de otras suites.
describe('US-023 historial HTTP + PostgreSQL aislado', () => {
  let app: INestApplication; let prisma: PrismaClient;
  const password = randomBytes(24).toString('hex');
  const users: string[] = []; const agents: Partial<Record<string, request.Agent>> = {};
  const drivers: string[] = []; const orders: string[] = []; const routes: string[] = []; const alternatives: string[] = [];
  let vehicle = ''; let plate = ''; let client = ''; let plan = ''; let execution = '';
  let ids: Record<'old' | 'recent' | 'running', string> = { old: '', recent: '', running: '' };
  let ip = 1;
  const get = (role: string, path: string) => agents[role]!.get(path).set('X-Forwarded-For', `192.0.2.${ip++ % 250 + 1}`);
  const admin = (path: string) => get(ROLE_NAMES.administrator, path);
  const mine = (body: { items: { ruta_id: string }[] }) => body.items.filter(item => routes.includes(item.ruta_id));

  async function seedRoute(estado: 'EN_CURSO' | 'COMPLETADA', start: Date, end: Date | null, stops: ('ENTREGADA' | 'NO_ENTREGADA' | 'PENDIENTE')[], index: number, confirmed = false) {
    const alternative = await prisma.alternativaRuta.create({ data: { ejecucion_id: execution, numero: index } });
    alternatives.push(alternative.alternativa_id);
    const stopOrders: string[] = [];
    for (let position = 0; position < stops.length; position++) {
      const order = await prisma.pedido.create({ data: { cliente_id: client, peso_kg: 1, ventana_inicio: new Date('2032-08-01T12:00:00Z'), ventana_fin: new Date('2032-08-01T15:00:00Z'), prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', estado: 'EN_RUTA' } });
      orders.push(order.pedido_id); stopOrders.push(order.pedido_id);
    }
    const before = new Date(+start - 3_600_000);
    const route = await prisma.ruta.create({
      data: {
        alternativa_id: alternative.alternativa_id, estado, conductor_id: drivers[0], asignado_en: start, iniciado_en: start, finalizado_en: end,
        ...(confirmed ? { confirmado_en: before, confirmado_por: users[0], version_confirmada: 1 } : {}),
        versiones: { create: { numero: 1, vehiculo_id: vehicle, distancia_m: 1000, duracion_s: 120, resultado: {}, input_hash: 'c'.repeat(64), paradas: { create: stops.map((state, position) => ({
          pedido_id: stopOrders[position], secuencia: position + 1, datos: { direccion: `Dirección histórica ${index}-${position + 1}` }, estado_entrega: state,
          causa_no_entrega: state === 'NO_ENTREGADA' ? 'Cliente ausente' : null, atendido_en: state === 'PENDIENTE' ? null : end ?? start,
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
      const account = await app.get(UsersService).create({ email: `hist-${randomBytes(10).toString('hex')}@example.test`, password, rol_id: role.rol_id, estado: 'ACTIVO' });
      users.push(account.usuario_id);
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login').set('X-Forwarded-For', `192.0.2.${ip++}`).send({ email: account.email, password }).expect(200);
      agents[nombre] = agent;
    }
    drivers.push((await prisma.conductor.create({ data: { nombre_completo: `Conductora historial ${randomBytes(3).toString('hex')}`, dni: randomBytes(8).toString('hex'), licencia_categoria: 'PRUEBA', telefono: 'SIN-DATO-REAL' } })).conductor_id);
    plate = `HS${randomBytes(4).toString('hex')}`.toUpperCase().slice(0, 15);
    vehicle = (await prisma.vehiculo.create({ data: { placa: plate, tipo: 'PRUEBA', capacidad_carga_kg: 100, consumo_km_l: 10, factor_emision_kg_co2_km: 0.2, anio_fabricacion: 2020 } })).vehiculo_id;
    client = (await prisma.cliente.create({ data: { nombre: 'Cliente sintético historial', direccion: 'Sin dirección real', latitud: 0, longitud: 0 } })).cliente_id;
    const planning = await prisma.planificacion.create({
      data: { creado_por: users[0], etiqueta: 'Plan sintético historial', versiones: { create: { numero: 1, snapshot: {}, input_hash: 'a'.repeat(64), ejecuciones: { create: { actor_id: users[0], idempotency_key: randomUUID(), request_hash: 'b'.repeat(64), estado: 'COMPLETADA', owner_token: randomUUID(), vence_en: new Date(Date.now() + 60000) } } } } },
      include: { versiones: { include: { ejecuciones: true } } },
    });
    plan = planning.planificacion_id; execution = planning.versiones[0].ejecuciones[0].ejecucion_id;
    // «old»: terminó el 2032-08-05 (Lima), sin confirmación (anterior a US-020), todo entregado.
    // «recent»: terminó el 2032-08-20 23:30 Lima (04:30 UTC del 21), confirmada, con no entrega, incidencia y sostenibilidad.
    const old = await seedRoute('COMPLETADA', new Date('2032-08-05T13:00:00Z'), new Date('2032-08-05T14:00:00Z'), ['ENTREGADA', 'ENTREGADA'], 1);
    const recent = await seedRoute('COMPLETADA', new Date('2032-08-21T02:00:00Z'), new Date('2032-08-21T04:30:00Z'), ['ENTREGADA', 'NO_ENTREGADA'], 2, true);
    const running = await seedRoute('EN_CURSO', new Date('2032-08-21T02:00:00Z'), null, ['PENDIENTE'], 3);
    ids = { old: old.ruta_id, recent: recent.ruta_id, running: running.ruta_id };
    await prisma.incidenciaEntrega.create({ data: { parada_id: recent.versiones[0].paradas[1].parada_id, conductor_id: drivers[0], tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende' } });
    await prisma.registroSostenibilidad.create({ data: { ruta_id: recent.ruta_id, ruta_version: 1, vehiculo_id: vehicle, distancia_km: 8.5, combustible_l: 0.85, factor_emision_kg_co2_km: 0.2, emisiones_co2_kg: 1.7, origen_datos: 'MEDIDO', registrado_por: users[1] } });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (!prisma) return;
    await prisma.registroSostenibilidad.deleteMany({ where: { ruta_id: { in: routes } } });
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

  it('solo Administrador y Operador / Técnico consultan el historial', async () => {
    await get(ROLE_NAMES.operator, '/operations/history').expect(200);
    await get(ROLE_NAMES.driver, '/operations/history').expect(403);
    await get(ROLE_NAMES.auditor, `/operations/history/${ids.recent}`).expect(403);
    await request(app.getHttpServer()).get('/operations/history').expect(401);
  });

  it('escenario 1: muestra las operaciones terminadas, de la más reciente a la más antigua y sin las rutas en curso', async () => {
    const response = await admin(`/operations/history?search=${plate}`).expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({ total: 2, page: 1, pageSize: 12 });
    expect(mine(response.body).map(item => item.ruta_id)).toEqual([ids.recent, ids.old]);
    expect(response.body.items[0]).toMatchObject({
      planificacion: { etiqueta: 'Plan sintético historial' }, vehiculo: { placa: plate },
      entregas: { total: 2, realizadas: 1, no_realizadas: 1 }, incidencias: 1, con_sostenibilidad: true,
    });
    expect(response.body.items[1]).toMatchObject({ entregas: { total: 2, realizadas: 2, no_realizadas: 0 }, incidencias: 0, con_sostenibilidad: false });
  });

  it.each([
    ['desde=2032-08-20&hasta=2032-08-20', ['recent']],
    ['desde=2032-08-01&hasta=2032-08-10', ['old']],
    ['con_incidencias=true', ['recent']],
    ['con_no_entregas=true', ['recent']],
  ])('aplica el filtro %s (fechas de finalización en Lima)', async (query, expected) => {
    const body = (await admin(`/operations/history?search=${plate}&${query}`).expect(200)).body;
    expect(mine(body).map(item => item.ruta_id)).toEqual(expected.map(key => ids[key as keyof typeof ids]));
  });

  it('escenario 2: un periodo sin operaciones responde una lista vacía', async () => {
    const body = (await admin(`/operations/history?search=${plate}&desde=2032-08-11&hasta=2032-08-19`).expect(200)).body;
    expect(body).toMatchObject({ items: [], total: 0 });
  });

  it('el detalle reúne planificación, confirmación, ejecución, entregas, incidencias y sostenibilidad', async () => {
    const body = (await admin(`/operations/history/${ids.recent}`).expect(200)).body;
    const confirmer = await prisma.usuario.findUniqueOrThrow({ where: { usuario_id: users[0] } });
    const registrar = await prisma.usuario.findUniqueOrThrow({ where: { usuario_id: users[1] } });
    expect(body).toMatchObject({
      ruta_id: ids.recent, estado: 'COMPLETADA', version_confirmada: 1, confirmado_por: confirmer.email,
      planificacion: { planificacion_id: plan, etiqueta: 'Plan sintético historial', version: 1 },
      conductor: { conductor_id: drivers[0] }, version: { numero: 1, vehiculo: { placa: plate } },
      entregas: { total: 2, realizadas: 1, no_realizadas: 1 }, incidencias: 1,
      sostenibilidad: { emisiones_co2_kg: '1.7', origen_datos: 'MEDIDO', registrador: { email: registrar.email } },
    });
    expect(body.paradas.map((stop: { direccion: string; estado_entrega: string }) => [stop.direccion, stop.estado_entrega])).toEqual([['Dirección histórica 2-1', 'ENTREGADA'], ['Dirección histórica 2-2', 'NO_ENTREGADA']]);
    expect(body.paradas[1].incidencias).toEqual([expect.objectContaining({ tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende' })]);
    const old = (await admin(`/operations/history/${ids.old}`).expect(200)).body;
    expect(old).toMatchObject({ confirmado_en: null, confirmado_por: null, sostenibilidad: null });
  });

  it('responde 404 para una ruta en curso o inexistente y 400 para un identificador inválido', async () => {
    await admin(`/operations/history/${ids.running}`).expect(404);
    await admin(`/operations/history/${randomUUID()}`).expect(404);
    await admin('/operations/history/no-es-uuid').expect(400);
  });

  it.each([
    ['desde=2032-08-20&hasta=2032-08-01', 'El rango de fechas no es válido: «desde» es posterior a «hasta».'],
    ['hasta=2032-02-30', 'hasta: la fecha no existe.'],
    ['con_incidencias=si', ['con_incidencias debe ser true o false.']],
    ['estado=EN_CURSO', ['property estado should not exist']],
  ])('rechaza %s con 400', async (query, message) => {
    expect((await admin(`/operations/history?${query}`).expect(400)).body.message).toEqual(message);
  });
});
