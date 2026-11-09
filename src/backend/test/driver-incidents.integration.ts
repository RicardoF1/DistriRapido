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

// US-018 / RF-015: registro de incidencias HTTP + PostgreSQL aislado, con datos sintéticos.
describe('US-018 incidencias de entrega HTTP + PostgreSQL aislado', () => {
  let app: INestApplication; let prisma: PrismaClient;
  const password = randomBytes(24).toString('hex');
  const users: string[] = []; const drivers: string[] = []; const agents: request.Agent[] = [];
  let actor = ''; let vehicle = ''; let client = ''; let order = ''; let plan = ''; let routeId = ''; let stopId = '';
  let ip = 1;
  const post = (agent: request.Agent, id: string, body: unknown) => agent.post(`/driver/deliveries/${id}/incidents`).set('X-Forwarded-For', `198.51.100.${ip++}`).send(body as object);

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || (!new URL(url).pathname.endsWith('_test') && !/^distrirapido_[a-z0-9_]+_test$/.test(new URL(url).searchParams.get('schema') ?? ''))) throw new Error('Requiere base o esquema aislado de pruebas.');
    process.env.DATABASE_URL = url; process.env.JWT_SECRET = randomBytes(48).toString('hex');
    prisma = new PrismaClient();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');
    configureApp(app, 'http://localhost:5173'); await app.init();
    const role = await prisma.rol.upsert({ where: { nombre: ROLE_NAMES.driver }, update: {}, create: { nombre: ROLE_NAMES.driver, descripcion: 'Prueba aislada' } });
    for (let index = 0; index < 2; index++) {
      const account = await app.get(UsersService).create({ email: `incident-${randomBytes(10).toString('hex')}@example.test`, password, rol_id: role.rol_id, estado: 'ACTIVO' });
      users.push(account.usuario_id);
      drivers.push((await prisma.conductor.create({ data: { usuario_id: account.usuario_id, nombre_completo: `Conductor incidencias ${index}`, dni: randomBytes(8).toString('hex'), licencia_categoria: 'PRUEBA', telefono: 'SIN-DATO-REAL' } })).conductor_id);
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login').set('X-Forwarded-For', `198.51.100.${ip++}`).send({ email: account.email, password }).expect(200);
      agents.push(agent);
    }
    actor = users[0];
    vehicle = (await prisma.vehiculo.create({ data: { placa: `T${randomBytes(4).toString('hex')}`.slice(0, 15), tipo: 'PRUEBA', capacidad_carga_kg: 100, consumo_km_l: 10, factor_emision_kg_co2_km: 0.1, anio_fabricacion: 2020 } })).vehiculo_id;
    client = (await prisma.cliente.create({ data: { nombre: 'Cliente sintético', direccion: 'Sin dirección real', latitud: 0, longitud: 0 } })).cliente_id;
    order = (await prisma.pedido.create({ data: { cliente_id: client, peso_kg: 1, ventana_inicio: new Date('2030-01-01T12:00:00Z'), ventana_fin: new Date('2030-01-01T15:00:00Z'), prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', estado: 'EN_RUTA' } })).pedido_id;
    const planning = await prisma.planificacion.create({
      data: {
        creado_por: actor, etiqueta: 'Plan sintético incidencias',
        versiones: { create: { numero: 1, snapshot: {}, input_hash: 'a'.repeat(64), ejecuciones: { create: { actor_id: actor, idempotency_key: randomUUID(), request_hash: 'b'.repeat(64), estado: 'COMPLETADA', owner_token: randomUUID(), vence_en: new Date(Date.now() + 60000) } } } },
      },
      include: { versiones: { include: { ejecuciones: true } } },
    });
    plan = planning.planificacion_id;
    const route = await prisma.ruta.create({
      data: {
        alternativa: { create: { ejecucion_id: planning.versiones[0].ejecuciones[0].ejecucion_id } },
        conductor: { connect: { conductor_id: drivers[0] } }, estado: 'EN_CURSO', asignado_en: new Date(Date.now() - 60000), iniciado_en: new Date(),
        versiones: { create: { numero: 1, vehiculo_id: vehicle, distancia_m: 1000, duracion_s: 120, resultado: {}, input_hash: 'c'.repeat(64), paradas: { create: { pedido_id: order, secuencia: 1, datos: {} } } } },
      },
      include: { versiones: { include: { paradas: true } } },
    });
    routeId = route.ruta_id; stopId = route.versiones[0].paradas[0].parada_id;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (!prisma) return;
    await prisma.incidenciaEntrega.deleteMany({ where: { conductor_id: { in: drivers } } });
    if (routeId) {
      await prisma.paradaRuta.deleteMany({ where: { ruta_version: { ruta_id: routeId } } });
      await prisma.rutaVersion.deleteMany({ where: { ruta_id: routeId } });
      const route = await prisma.ruta.delete({ where: { ruta_id: routeId } });
      await prisma.alternativaRuta.delete({ where: { alternativa_id: route.alternativa_id } });
    }
    if (plan) {
      await prisma.ejecucionCalculo.deleteMany({ where: { version: { planificacion_id: plan } } });
      await prisma.planificacionVersion.deleteMany({ where: { planificacion_id: plan } });
      await prisma.planificacion.delete({ where: { planificacion_id: plan } });
    }
    if (order) await prisma.pedido.delete({ where: { pedido_id: order } });
    if (client) await prisma.cliente.delete({ where: { cliente_id: client } });
    if (vehicle) await prisma.vehiculo.delete({ where: { vehiculo_id: vehicle } });
    await prisma.conductor.deleteMany({ where: { conductor_id: { in: drivers } } });
    await prisma.usuario.deleteMany({ where: { usuario_id: { in: users } } });
    await prisma.$disconnect();
  });

  it('registra la incidencia, la asocia a la entrega y no cambia su estado', async () => {
    const response = await post(agents[0], stopId, { tipo: 'VIA_BLOQUEADA', descripcion: ' Obra en la avenida ', detalle_complementario: 'Desvío por la calle paralela' }).expect(201);
    expect(response.body).toMatchObject({ parada_id: stopId, incidencia: { tipo: 'VIA_BLOQUEADA', descripcion: 'Obra en la avenida', detalle_complementario: 'Desvío por la calle paralela' } });
    const stored = await prisma.incidenciaEntrega.findUniqueOrThrow({ where: { incidencia_id: response.body.incidencia.incidencia_id } });
    expect(stored).toMatchObject({ parada_id: stopId, conductor_id: drivers[0] });
    expect((await prisma.paradaRuta.findUniqueOrThrow({ where: { parada_id: stopId } })).estado_entrega).toBe('PENDIENTE');
    const detail = await agents[0].get(`/driver/routes/${routeId}`).set('X-Forwarded-For', `198.51.100.${ip++}`).expect(200);
    expect(detail.body.version.paradas[0].incidencias).toEqual([expect.objectContaining({ incidencia_id: stored.incidencia_id, tipo: 'VIA_BLOQUEADA' })]);
  });

  it('rechaza información incompleta indicando cada dato faltante', async () => {
    const before = await prisma.incidenciaEntrega.count({ where: { parada_id: stopId } });
    const response = await post(agents[0], stopId, {}).expect(400);
    expect(response.body.message).toEqual(expect.arrayContaining(['tipo: selecciona el tipo de incidencia.', 'descripcion: describe la incidencia.']));
    await post(agents[0], stopId, { tipo: 'OTRO', descripcion: '   ' }).expect(400);
    await post(agents[0], stopId, { tipo: 'OTRO', descripcion: 'x', conductor_id: drivers[1] }).expect(400);
    expect(await prisma.incidenciaEntrega.count({ where: { parada_id: stopId } })).toBe(before);
  });

  it('deniega entregas de otro conductor e identificadores inexistentes', async () => {
    await post(agents[1], stopId, { tipo: 'OTRO', descripcion: 'Intento ajeno' }).expect(403);
    await post(agents[0], randomUUID(), { tipo: 'OTRO', descripcion: 'No existe' }).expect(403);
    expect(await prisma.incidenciaEntrega.count({ where: { conductor_id: drivers[1] } })).toBe(0);
  });

  it('rechaza el registro cuando la ruta ya está completada', async () => {
    await prisma.ruta.update({ where: { ruta_id: routeId }, data: { estado: 'COMPLETADA', finalizado_en: new Date() } });
    try {
      await post(agents[0], stopId, { tipo: 'OTRO', descripcion: 'Tarde' }).expect(409);
    } finally {
      await prisma.ruta.update({ where: { ruta_id: routeId }, data: { estado: 'EN_CURSO', finalizado_en: null } });
    }
  });

  it('la base de datos impide tipos fuera del catálogo', async () => {
    await expect(prisma.incidenciaEntrega.create({ data: { parada_id: stopId, conductor_id: drivers[0], tipo: 'INVENTADO', descripcion: 'x' } })).rejects.toThrow();
  });
});
