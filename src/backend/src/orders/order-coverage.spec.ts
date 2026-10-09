import 'reflect-metadata';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderConsultationGuard } from './order-consultation.guard';
import { OrderRegistrationGuard } from './order-registration.guard';
import { synthetic, syntheticPackage } from '../../test/synthetic-coverage';
const directory=syntheticPackage();
import { CoverageService } from '../coverage/coverage.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { RequestOriginGuard } from '../common/request-origin';
import { configureApp } from '../common/configure-app';
const payload={cliente:{nombre:'Fixture',direccion:'Fixture',latitud:2,longitud:2},peso_kg:1,prioridad:'ESTANDAR',tipo_producto:'NO_PERECEDERO',ventana_inicio:'2026-10-09T09:00:00-05:00',ventana_fin:'2026-10-09T11:00:00-05:00'};
const tx={cliente:{create:jest.fn()},pedido:{create:jest.fn()}};
const prisma={$transaction:jest.fn(),pedido:{findMany:jest.fn(),count:jest.fn()}};
const coverage=new CoverageService();
beforeEach(()=>{jest.clearAllMocks();coverage.load(directory, synthetic.release);tx.cliente.create.mockResolvedValue({cliente_id:'fixture'});tx.pedido.create.mockResolvedValue({pedido_id:'fixture'});prisma.$transaction.mockImplementation((arg:unknown)=>typeof arg==='function'?arg(tx):Promise.all(arg as Promise<unknown>[]));});
it.each([{latitud:20,longitud:40},{latitud:91,longitud:0},{latitud:2.0000001,longitud:2}])('rechazo previo sin transacción ni escrituras: %j', point=>{
  expect(()=>new OrdersService(prisma as unknown as PrismaService,coverage).create({...payload,cliente:{...payload.cliente,...point}})).toThrow();
  expect(prisma.$transaction).not.toHaveBeenCalled();expect(tx.cliente.create).not.toHaveBeenCalled();expect(tx.pedido.create).not.toHaveBeenCalled();
});
it('recursos ausentes rechazan antes de transacción',()=>{
  const unavailable=new CoverageService();expect(()=>new OrdersService(prisma as unknown as PrismaService,unavailable).create(payload)).toThrow('cobertura');expect(prisma.$transaction).not.toHaveBeenCalled();expect(tx.cliente.create).not.toHaveBeenCalled();expect(tx.pedido.create).not.toHaveBeenCalled();
});
it('confirmación persiste exactamente el punto validado',async()=>{
  await new OrdersService(prisma as unknown as PrismaService,coverage).create(payload);expect(prisma.$transaction).toHaveBeenCalledTimes(1);expect(tx.cliente.create).toHaveBeenCalledWith({data:payload.cliente,select:{cliente_id:true}});expect(tx.pedido.create).toHaveBeenCalledTimes(1);
});
describe('HTTP con Auth/Prisma simulados y cobertura sintética',()=>{
  let app:INestApplication;
  beforeAll(async()=>{
    const module=await Test.createTestingModule({controllers:[OrdersController],providers:[OrdersService,JwtAuthGuard,RequestOriginGuard,OrderRegistrationGuard,OrderConsultationGuard,
      {provide:CoverageService,useValue:coverage},{provide:PrismaService,useValue:prisma},{provide:ConfigService,useValue:{getOrThrow:()=> 'http://localhost:5173'}},
      {provide:AuthService,useValue:{authenticate:async(token:string)=>{if(token==='expired')throw new UnauthorizedException();return {rol:{nombre:token}};}}},
    ]}).compile();app=module.createNestApplication();configureApp(app,'http://localhost:5173');await app.init();
  });
  afterAll(async()=>{await app.close();});
  it.each(['Administrador','Operador / Técnico'])('permite punto autorizado: %s',async role=>{await request(app.getHttpServer()).post('/orders').set('Cookie','distrirapido_session='+encodeURIComponent(role)).send(payload).expect(201);});
  it('exterior devuelve 400 sin escribir',async()=>{
    const response=await request(app.getHttpServer()).post('/orders').set('Cookie','distrirapido_session=Administrador').send({...payload,cliente:{...payload.cliente,latitud:20,longitud:40}}).expect(400);
    expect(response.body.message).toContain('fuera de cobertura');expect(prisma.$transaction).not.toHaveBeenCalled();expect(tx.cliente.create).not.toHaveBeenCalled();expect(tx.pedido.create).not.toHaveBeenCalled();
  });
  it('cobertura ausente devuelve 503 sin escribir',async()=>{
    coverage.load('/nonexistent-coverage-fixture');const response=await request(app.getHttpServer()).post('/orders').set('Cookie','distrirapido_session=Administrador').send(payload).expect(503);
    expect(response.body.message).toContain('cobertura');expect(prisma.$transaction).not.toHaveBeenCalled();expect(tx.cliente.create).not.toHaveBeenCalled();expect(tx.pedido.create).not.toHaveBeenCalled();
  });
  it.each(['Usuario Final / Conductor','Auditor Externo'])('deniega escritura: %s',async role=>{await request(app.getHttpServer()).post('/orders').set('Cookie','distrirapido_session='+encodeURIComponent(role)).send(payload).expect(403);expect(prisma.$transaction).not.toHaveBeenCalled();});
  it('sesión ausente devuelve 401',async()=>{await request(app.getHttpServer()).post('/orders').send(payload).expect(401);expect(prisma.$transaction).not.toHaveBeenCalled();});
  it('consulta sigue disponible si la cobertura falla',async()=>{
    coverage.load('/nonexistent-coverage-fixture');prisma.pedido.findMany.mockResolvedValue([]);prisma.pedido.count.mockResolvedValue(0);
    const response=await request(app.getHttpServer()).get('/orders').set('Cookie','distrirapido_session=Administrador').expect(200);expect(response.body.total).toBe(0);expect(tx.cliente.create).not.toHaveBeenCalled();
  });
});
