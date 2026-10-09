import 'reflect-metadata';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { AdminSummaryService } from './admin-summary.service';
import { AdminSummaryController } from './admin-summary.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdministratorGuard } from '../auth/administrator.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { configureApp } from '../common/configure-app';
const prisma = { pedido: { groupBy: jest.fn() }, usuario: { count: jest.fn() }, $transaction: jest.fn() };
beforeEach(() => {
  jest.clearAllMocks(); prisma.pedido.groupBy.mockResolvedValue([]); prisma.usuario.count.mockResolvedValue(0);
  prisma.$transaction.mockImplementation((operation: (tx: unknown) => Promise<unknown>) => operation(prisma));
});
describe('Resumen agregado', () => {
  it.each([0, 1, 251])('conteos independientes de paginación: %s pedidos', async count => {
    prisma.pedido.groupBy.mockResolvedValue(count ? [{ estado: 'PENDIENTE', _count: { _all: count } }] : []);
    prisma.usuario.count.mockResolvedValue(21);
    const result = await new AdminSummaryService(prisma as unknown as PrismaService).get();
    expect(result).toEqual({ totalOrders: count, pendingOrders: count, totalUsers: 21, ordersByState: count ? [{ state: 'PENDIENTE', count }] : [] });
    expect(prisma.pedido.groupBy).toHaveBeenCalledWith({ by: ['estado'], _count: { _all: true }, orderBy: { estado: 'asc' } });
    expect(prisma.usuario.count).toHaveBeenCalledWith();
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  });
  it('agrupa estados almacenados sin inventarlos ni equiparar total a pendientes', async () => {
    // Distintos valores de texto son fixtures; no habilitan estados de negocio nuevos.
    prisma.pedido.groupBy.mockResolvedValue([{ estado: 'PENDIENTE', _count: { _all: 2 } }, { estado: 'ESTADO_EXISTENTE_EN_DATOS', _count: { _all: 4 } }]);
    expect(await new AdminSummaryService(prisma as unknown as PrismaService).get()).toEqual({ totalOrders: 6, pendingOrders: 2, totalUsers: 0, ordersByState: [{ state: 'PENDIENTE', count: 2 }, { state: 'ESTADO_EXISTENTE_EN_DATOS', count: 4 }] });
  });
  it('sin grupo PENDIENTE devuelve cero pendientes y conserva total', async () => {
    prisma.pedido.groupBy.mockResolvedValue([{ estado: 'ESTADO_EXISTENTE_EN_DATOS', _count: { _all: 4 } }]);
    expect(await new AdminSummaryService(prisma as unknown as PrismaService).get()).toMatchObject({ totalOrders: 4, pendingOrders: 0 });
  });
  it('propaga fallo de base sin convertirlo en ceros', async () => {
    prisma.pedido.groupBy.mockRejectedValue(new Error('database unavailable'));
    await expect(new AdminSummaryService(prisma as unknown as PrismaService).get()).rejects.toThrow('database unavailable');
  });
});
describe('HTTP y permisos con Prisma simulado', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [AdminSummaryController], providers: [AdminSummaryService, JwtAuthGuard, AdministratorGuard, RequestOriginGuard,
      { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: { getOrThrow: () => 'http://localhost:5173' } },
      { provide: AuthService, useValue: { authenticate: async (token: string) => { if (token === 'expired') throw new UnauthorizedException(); return { rol: { nombre: token } }; } } },
    ] }).compile();
    app = module.createNestApplication(); configureApp(app, 'http://localhost:5173'); await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('Administrador recibe solo conteos sin caché', async () => {
    const response = await request(app.getHttpServer()).get('/admin/summary').set('Cookie', 'distrirapido_session=Administrador').expect(200);
    expect(response.body).toEqual({ totalOrders: 0, pendingOrders: 0, totalUsers: 0, ordersByState: [] });
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it.each(['Operador / Técnico', 'Usuario Final / Conductor', 'Auditor Externo'])('rechaza %s sin consultar base', async role => {
    await request(app.getHttpServer()).get('/admin/summary').set('Cookie', 'distrirapido_session=' + encodeURIComponent(role)).expect(403);
    expect(prisma.pedido.groupBy).not.toHaveBeenCalled(); expect(prisma.usuario.count).not.toHaveBeenCalled();
  });
  it('sesión ausente o vencida recibe 401', async () => {
    await request(app.getHttpServer()).get('/admin/summary').expect(401);
    await request(app.getHttpServer()).get('/admin/summary').set('Cookie', 'distrirapido_session=expired').expect(401);
  });
  it('no autoriza lectura CORS desde origen ajeno', async () => {
    const response = await request(app.getHttpServer()).get('/admin/summary').set('Cookie', 'distrirapido_session=Administrador').set('Origin', 'https://other.example.com').expect(200);
    expect(response.headers['access-control-allow-origin']).not.toBe('https://other.example.com');
  });
  it('fallo de base recibe 500 sin secretos ni ceros falsos', async () => {
    prisma.pedido.groupBy.mockRejectedValue(new Error('internal-db-secret'));
    const response = await request(app.getHttpServer()).get('/admin/summary').set('Cookie', 'distrirapido_session=Administrador').expect(500);
    expect(JSON.stringify(response.body)).not.toContain('internal-db-secret'); expect(response.body.totalOrders).toBeUndefined();
  });
});
