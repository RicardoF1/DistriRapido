import 'reflect-metadata';
import { Controller, Get, Header, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import request from 'supertest';
import { configureApp } from './configure-app';
import { NO_STORE, PRIVATE_REVALIDATE } from './cache-policy';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PaginationQueryDto, pageWindow } from './pagination';
import { RolesController } from '../roles/roles.controller';
import { VehiclesController } from '../vehicles/vehicles.controller';
import { UsersController } from '../users/users.controller';
import { ORDER_LIST_SELECT } from '../orders/orders.service';

// Green IT: comprobaciones de las optimizaciones del backend (áreas 1, 2, 7 y 8).
const large = Array.from({ length: 80 }, (_, index) => ({ id: index, nombre: `Registro de prueba ${index}`, estado: 'ACTIVO' }));

@Controller('green')
class GreenTestController {
  @Get('large') @Header('Cache-Control', PRIVATE_REVALIDATE) large() { return large; }
  @Get('small') small() { return { ok: true }; }
}

describe('Green IT: compresión y caché HTTP (áreas 7 y 8)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [GreenTestController] }).compile();
    app = module.createNestApplication();
    configureApp(app, 'http://localhost:5173');
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  it.each([['br', 'br'], ['gzip', 'gzip'], ['br, gzip', 'br']])('Accept-Encoding %s comprime con %s', async (accept, encoding) => {
    const response = await request(app.getHttpServer()).get('/green/large').set('Accept-Encoding', accept).expect(200);
    expect(response.headers['content-encoding']).toBe(encoding);
    expect(response.headers.vary).toMatch(/Accept-Encoding/);
    expect(response.body).toEqual(large);
  });

  it('no comprime respuestas por debajo de 1 KB ni sin Accept-Encoding', async () => {
    expect((await request(app.getHttpServer()).get('/green/small').set('Accept-Encoding', 'br, gzip').expect(200)).headers['content-encoding']).toBeUndefined();
    expect((await request(app.getHttpServer()).get('/green/large').set('Accept-Encoding', 'identity').expect(200)).headers['content-encoding']).toBeUndefined();
  });

  it('revalida con ETag y responde 304 sin cuerpo', async () => {
    const first = await request(app.getHttpServer()).get('/green/large').expect(200);
    expect(first.headers['cache-control']).toBe('private, no-cache');
    expect(first.headers.etag).toBeTruthy();
    const second = await request(app.getHttpServer()).get('/green/large').set('If-None-Match', first.headers.etag).expect(304);
    expect(second.text).toBe('');
  });
});

describe('Green IT: política de caché por endpoint (área 7)', () => {
  const cacheControl = (handler: object) => (Reflect.getMetadata('__headers__', handler) as { name: string; value: string }[] | undefined)?.find(header => header.name === 'Cache-Control')?.value;
  it('solo los catálogos de baja sensibilidad usan revalidación privada', () => {
    expect(cacheControl(RolesController.prototype.list)).toBe(PRIVATE_REVALIDATE);
    expect(cacheControl(VehiclesController.prototype.list)).toBe(PRIVATE_REVALIDATE);
  });
  it('los datos personales y el detalle mantienen no-store', () => {
    expect(cacheControl(UsersController.prototype.list)).toBe(NO_STORE);
    expect(cacheControl(VehiclesController.prototype.get)).toBe(NO_STORE);
  });
});

describe('Green IT: paginación de 12 y select mínimo (áreas 1 y 2)', () => {
  it('pagina por defecto en bloques de 12 con límite de 100', async () => {
    const query = plainToInstance(PaginationQueryDto, {});
    expect(DEFAULT_PAGE_SIZE).toBe(12);
    expect(query).toMatchObject({ page: 1, pageSize: 12 });
    expect(pageWindow(3, 12)).toEqual({ skip: 24, take: 12 });
    expect(await validate(plainToInstance(PaginationQueryDto, { pageSize: String(MAX_PAGE_SIZE + 1) }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(PaginationQueryDto, { page: '0' }))).not.toHaveLength(0);
  });
  it('el listado de pedidos solo trae las columnas mostradas', () => {
    expect(Object.keys(ORDER_LIST_SELECT.cliente.select)).toEqual(['nombre', 'direccion']);
    expect(ORDER_LIST_SELECT).not.toHaveProperty('descripcion_carga');
    expect(ORDER_LIST_SELECT).not.toHaveProperty('cliente_id');
  });
});
