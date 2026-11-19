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

// US-022 / RF-020: indicadores HTTP + PostgreSQL aislado. Fechas propias (junio de 2031)
// para no interferir con los datos de otras suites.
describe('US-022 indicadores HTTP + PostgreSQL aislado', () => {
  let app: INestApplication; let prisma: PrismaClient;
  const password = randomBytes(24).toString('hex');
  const users: string[] = []; const agents: Partial<Record<string, request.Agent>> = {};
  const drivers: string[] = []; const orders: string[] = []; const routes: string[] = []; const alternatives: string[] = [];
  let vehicle = ''; let client = ''; let plan = ''; let execution = '';
  let ip = 1;
  const get = (role: string, path: string) => agents[role]!.get(path).set('X-Forwarded-For', `198.51.100.${ip++ % 250 + 1}`);
  const admin = (path: string) => get(ROLE_NAMES.administrator, path);

  // Ruta con inicio y fin explícitos (UTC). Lima = UTC−05:00.
  async function seedRoute(estado: 'EN_CURSO' | 'COMPLETADA', start: Date, end: Date | null, stops: ('PENDIENTE' | 'ENTREGADA' | 'NO_ENTREGADA')[], index: number) {
    const alternative = await prisma.alternativaRuta.create({ data: { ejecucion_id: execution, numero: index } });
    alternatives.push(alternative.alternativa_id);
    const stopOrders: string[] = [];
    for (let position = 0; position < stops.length; position++) {
      const order = await prisma.pedido.create({ data: { cliente_id: client, peso_kg: 1, ventana_inicio: new Date('2031-06-01T12:00:00Z'), ventana_fin: new Date('2031-06-01T15:00:00Z'), prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', estado: 'EN_RUTA' } });
      orders.push(order.pedido_id); stopOrders.push(order.pedido_id);
    }
    const route = await prisma.ruta.create({
      data: {
        alternativa_id: alternative.alternativa_id, estado, conductor_id: drivers[0], asignado_en: start, iniciado_en: start, finalizado_en: end,
        versiones: { create: { numero: 1, vehiculo_id: vehicle, distancia_m: 1000, duracion_s: 120, resultado: {}, input_hash: 'c'.repeat(64), paradas: { create: stops.map((state, position) => ({
          pedido_id: stopOrders[position], secuencia: position + 1, datos: { direccion: `Dirección sintética ${index}-${position + 1}` }, estado_entrega: state,
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
      const account = await app.get(UsersService).create({ email: `kpi-${randomBytes(10).toString('hex')}@example.test`, password, rol_id: role.rol_id, estado: 'ACTIVO' });
      users.push(account.usuario_id);
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login').set('X-Forwarded-For', `198.51.100.${ip++}`).send({ email: account.email, password }).expect(200);
      agents[nombre] = agent;
    }
    drivers.push((await prisma.conductor.create({ data: { nombre_completo: `Conductor indicadores ${randomBytes(3).toString('hex')}`, dni: randomBytes(8).toString('hex'), licencia_categoria: 'PRUEBA', telefono: 'SIN-DATO-REAL' } })).conductor_id);
    vehicle = (await prisma.vehiculo.create({ data: { placa: `KP${randomBytes(4).toString('hex')}`.toUpperCase().slice(0, 15), tipo: 'PRUEBA', capacidad_carga_kg: 100, consumo_km_l: 10, factor_emision_kg_co2_km: 0.2, anio_fabricacion: 2020 } })).vehiculo_id;
    client = (await prisma.cliente.create({ data: { nombre: 'Cliente sintético indicadores', direccion: 'Sin dirección real', latitud: 0, longitud: 0 } })).cliente_id;
    const planning = await prisma.planificacion.create({
      data: { creado_por: users[0], etiqueta: 'Plan sintético indicadores', versiones: { create: { numero: 1, snapshot: {}, input_hash: 'a'.repeat(64), ejecuciones: { create: { actor_id: users[0], idempotency_key: randomUUID(), request_hash: 'b'.repeat(64), estado: 'COMPLETADA', owner_token: randomUUID(), vence_en: new Date(Date.now() + 60000) } } } } },
      include: { versiones: { include: { ejecuciones: true } } },
    });
    plan = planning.planificacion_id; execution = planning.versiones[0].ejecuciones[0].ejecucion_id;
    // Ruta A: 2031-06-10 08:00–09:00 Lima. Ruta B: termina 2031-06-10 23:30 Lima (04:30 UTC del día 11).
    // Ruta C: 2031-06-20 (fuera del periodo del 10). Ruta D: en curso, nunca cuenta.
    const a = await seedRoute('COMPLETADA', new Date('2031-06-10T13:00:00Z'), new Date('2031-06-10T14:00:00Z'), ['ENTREGADA', 'ENTREGADA', 'NO_ENTREGADA'], 1);
    await seedRoute('COMPLETADA', new Date('2031-06-11T03:00:00Z'), new Date('2031-06-11T04:30:00Z'), ['ENTREGADA'], 2);
    await seedRoute('COMPLETADA', new Date('2031-06-20T13:00:00Z'), new Date('2031-06-20T14:00:00Z'), ['ENTREGADA'], 3);
    await seedRoute('EN_CURSO', new Date('2031-06-10T13:00:00Z'), null, ['PENDIENTE'], 4);
    await prisma.incidenciaEntrega.create({ data: { parada_id: a.versiones[0].paradas[2].parada_id, conductor_id: drivers[0], tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende' } });
    await prisma.incidenciaEntrega.create({ data: { parada_id: a.versiones[0].paradas[0].parada_id, conductor_id: drivers[0], tipo: 'VIA_BLOQUEADA', descripcion: 'Desvío' } });
    await prisma.registroSostenibilidad.create({ data: { ruta_id: a.ruta_id, ruta_version: 1, vehiculo_id: vehicle, distancia_km: 12.5, combustible_l: 1.25, factor_emision_kg_co2_km: 0.2, emisiones_co2_kg: 2.5, origen_datos: 'MEDIDO', costo_combustible: 20, registrado_por: users[0] } });
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

  it('solo Administrador y Operador / Técnico consultan los indicadores', async () => {
    await get(ROLE_NAMES.operator, '/operations/indicators?desde=2031-06-10&hasta=2031-06-10').expect(200);
    await get(ROLE_NAMES.driver, '/operations/indicators').expect(403);
    await get(ROLE_NAMES.auditor, '/operations/indicators').expect(403);
    await request(app.getHttpServer()).get('/operations/indicators').expect(401);
  });

  it('escenario 1: presenta los indicadores de las rutas completadas del día, en hora de Lima', async () => {
    const response = await admin('/operations/indicators?desde=2031-06-10&hasta=2031-06-10').expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      periodo: { desde: '2031-06-10', hasta: '2031-06-10' },
      datos_suficientes: true,
      operacion: {
        rutas_completadas: 2,
        entregas: { realizadas: 3, no_realizadas: 1, pendientes: 0, tasa_exito: 75 },
        incidencias: { total: 2, por_tipo: { CLIENTE_AUSENTE: 1, DIRECCION_INCORRECTA: 0, ACCESO_RESTRINGIDO: 0, VIA_BLOQUEADA: 1, VEHICULO_AVERIADO: 0, CARGA_DANADA: 0, OTRO: 0 } },
        duracion_media_min: 75,
      },
      sostenibilidad: {
        rutas_con_registro: 1, cobertura: 50, distancia_km: 12.5, combustible_l: 1.25, co2_kg: 2.5, co2_por_entrega_kg: 1.25,
        costo_combustible: 20, registros_con_costo: 1, origen: { ESTIMADO: 0, MEDIDO: 1 },
      },
    });
  });

  it('escenario 2: al ampliar el periodo se actualizan los indicadores', async () => {
    const body = (await admin('/operations/indicators?desde=2031-06-10&hasta=2031-06-20').expect(200)).body;
    expect(body.operacion.rutas_completadas).toBe(3);
    expect(body.operacion.entregas.realizadas).toBe(4);
    expect(body.sostenibilidad.cobertura).toBe(33.33);
  });

  it('ruta infeliz: un periodo sin rutas completadas informa datos insuficientes', async () => {
    const body = (await admin('/operations/indicators?desde=2031-06-12&hasta=2031-06-19').expect(200)).body;
    expect(body.datos_suficientes).toBe(false);
    expect(body.operacion).toMatchObject({ rutas_completadas: 0, entregas: { tasa_exito: null }, duracion_media_min: null });
    expect(body.sostenibilidad).toMatchObject({ cobertura: null, co2_kg: null });
  });

  it.each([
    ['desde=2031-06-20&hasta=2031-06-10', 'El periodo no es válido: «desde» es posterior a «hasta».'],
    ['desde=2031-02-30', 'desde: la fecha no existe.'],
    ['desde=2030-01-01&hasta=2031-06-10', 'El periodo no puede superar 366 días.'],
    ['desde=10-06-2031', ['desde debe tener el formato AAAA-MM-DD.']],
    ['periodo=mes', ['property periodo should not exist']],
  ])('rechaza %s con 400', async (query, message) => {
    expect((await admin(`/operations/indicators?${query}`).expect(400)).body.message).toEqual(message);
  });
});
