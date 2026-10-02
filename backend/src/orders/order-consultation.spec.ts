import 'reflect-metadata';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import request from 'supertest';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderQueryDto } from './order-query.dto';
import { OrderConsultationGuard } from './order-consultation.guard';
import { OrderRegistrationGuard } from './order-registration.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { configureApp } from '../common/configure-app';
const id = '10000000-0000-4000-8000-000000000001';
const order = { pedido_id: id, cliente_id: id, peso_kg: '2.50', volumen_m3: null, descripcion_carga: null, estado: 'PENDIENTE', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', ventana_inicio: new Date('2026-10-02T14:00:00Z'), ventana_fin: new Date('2026-10-02T16:00:00Z'), creado_en: new Date('2026-10-01T12:00:00Z'), cliente: { cliente_id: id, nombre: 'Comercial Mantaro', direccion: 'Av. Giraldez', telefono: null, email: null, referencia: null, latitud: '-12.065', longitud: '-75.204', estado: 'ACTIVO' } };
const prisma = { pedido: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() }, $transaction: jest.fn() };
let service: OrdersService;
beforeEach(() => {
  jest.clearAllMocks();
  prisma.pedido.findMany.mockResolvedValue([order]); prisma.pedido.count.mockResolvedValue(1); prisma.pedido.findUnique.mockResolvedValue(order);
  prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations));
  service = new OrdersService(prisma as unknown as PrismaService);
});
describe('US-005 consultas Prisma', () => {
  it.each(['Mantaro', 'Giraldez', id])('busca cliente/dirección/UUID sin N+1: %s', async search => {
    const result = await service.list(plainToInstance(OrderQueryDto, { search, estado: 'PENDIENTE', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', page: 2, pageSize: 10 }));
    expect(result).toEqual({ items: [order], total: 1, page: 2, pageSize: 10 });
    const args = prisma.pedido.findMany.mock.calls[0][0];
    expect(args).toMatchObject({ include: { cliente: true }, skip: 10, take: 10, where: { estado: 'PENDIENTE', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', OR: [{ cliente: { nombre: { contains: search, mode: 'insensitive' } } }, { cliente: { direccion: { contains: search, mode: 'insensitive' } } }, ...(search === id ? [{ pedido_id: id }] : [])] } });
    expect(prisma.pedido.count).toHaveBeenCalledWith({ where: args.where });
  });
  it('sin filtros, orden estable y lista vacía', async () => {
    prisma.pedido.findMany.mockResolvedValue([]); prisma.pedido.count.mockResolvedValue(0);
    expect(await service.list(new OrderQueryDto())).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
    expect(prisma.pedido.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {}, orderBy: [{ creado_en: 'desc' }, { pedido_id: 'desc' }] }));
  });
  it('detalle con cliente y 404', async () => {
    expect(await service.get(id)).toBe(order); expect(prisma.pedido.findUnique).toHaveBeenCalledWith({ where: { pedido_id: id }, include: { cliente: true } });
    prisma.pedido.findUnique.mockResolvedValue(null); await expect(service.get(id)).rejects.toThrow('Pedido no encontrado');
  });
  it.each([{ page: 0 }, { page: -1 }, { page: 1.2 }, { page: 'abc' }, { page: 100001 }, { pageSize: -1 }, { pageSize: 0 }, { pageSize: 101 }, { pageSize: 1.2 }, { estado: 'INVENTADO' }, { prioridad: 'ALTA' }, { tipo_producto: 'OTRO' }, { search: 'a'.repeat(256) }, { search: ['a'] }])('rechaza query inválida %j', async query => {
    expect((await validate(plainToInstance(OrderQueryDto, query))).length).toBeGreaterThan(0);
  });
  it('normaliza texto y valores por defecto', async () => {
    const query = plainToInstance(OrderQueryDto, { search: ' Mantaro ', page: '2', pageSize: '10' });
    expect(await validate(query)).toHaveLength(0); expect(query).toMatchObject({ search: 'Mantaro', page: 2, pageSize: 10 });
  });
  it.each(['Administrador', 'Operador / Técnico'])('autoriza %s', role => {
    expect(new OrderConsultationGuard().canActivate({ switchToHttp: () => ({ getRequest: () => ({ user: { rol: { nombre: role } } }) }) } as ExecutionContext)).toBe(true);
  });
  it.each(['Usuario Final / Conductor', 'Auditor Externo', 'Supervisor', undefined])('rechaza %s', role => {
    expect(() => new OrderConsultationGuard().canActivate({ switchToHttp: () => ({ getRequest: () => ({ user: role ? { rol: { nombre: role } } : undefined }) }) } as ExecutionContext)).toThrow('consultar pedidos');
  });
});
describe('US-005 HTTP con Prisma simulado', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [OrdersController], providers: [OrdersService, JwtAuthGuard, RequestOriginGuard, OrderConsultationGuard, OrderRegistrationGuard,
      { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: { getOrThrow: () => 'http://localhost:5173' } },
      { provide: AuthService, useValue: { authenticate: async (token: string) => { if (token === 'expired') throw new UnauthorizedException(); return { rol: { nombre: token } }; } } },
    ] }).compile();
    app = module.createNestApplication(); configureApp(app, 'http://localhost:5173'); await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('GET listado serializa cliente, decimales y volumen NULL', async () => {
    const response = await request(app.getHttpServer()).get('/orders').set('Cookie', 'distrirapido_session=Administrador').expect(200);
    expect(response.body).toEqual({ items: [{ ...order, ventana_inicio: order.ventana_inicio.toISOString(), ventana_fin: order.ventana_fin.toISOString(), creado_en: order.creado_en.toISOString() }], total: 1, page: 1, pageSize: 20 });
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it.each(['/orders', `/orders/${id}`])('sin sesión devuelve 401: %s', async path => { await request(app.getHttpServer()).get(path).expect(401); });
  it.each(['Usuario Final / Conductor', 'Auditor Externo'])('rol %s recibe 403 en listado y detalle', async role => {
    for (const path of ['/orders', `/orders/${id}`]) await request(app.getHttpServer()).get(path).set('Cookie', `distrirapido_session=${encodeURIComponent(role)}`).expect(403);
    expect(prisma.pedido.findMany).not.toHaveBeenCalled(); expect(prisma.pedido.findUnique).not.toHaveBeenCalled();
  });
  it('Operador consulta detalle con cookie', async () => {
    const response = await request(app.getHttpServer()).get(`/orders/${id}`).set('Cookie', 'distrirapido_session=Operador%20%2F%20T%C3%A9cnico').expect(200);
    expect(response.body.cliente.nombre).toBe('Comercial Mantaro');
  });
  it.each(['page=-1', 'pageSize=101', 'page=abc', 'estado=OTRO', 'prioridad=OTRO', 'tipo_producto=OTRO', 'extra=1'])('query inválida %s devuelve 400', async query => {
    await request(app.getHttpServer()).get(`/orders?${query}`).set('Cookie', 'distrirapido_session=Administrador').expect(400);
  });
  it('UUID inválido devuelve 400 y ausente devuelve 404', async () => {
    await request(app.getHttpServer()).get('/orders/invalid').set('Cookie', 'distrirapido_session=Administrador').expect(400);
    prisma.pedido.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer()).get(`/orders/${id}`).set('Cookie', 'distrirapido_session=Administrador').expect(404);
  });
  it('error de base no expone información interna', async () => {
    prisma.pedido.findUnique.mockRejectedValue(new Error('password=internal-database-secret'));
    const response = await request(app.getHttpServer()).get(`/orders/${id}`).set('Cookie', 'distrirapido_session=Administrador').expect(500);
    expect(JSON.stringify(response.body)).not.toContain('internal-database-secret');
  });
});
