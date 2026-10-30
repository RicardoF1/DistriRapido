import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../roles/roles';
import { CreateDriverDto, DriverQueryDto, UpdateDriverDto } from './dto/driver.dto';
import { driverSelection, driverView } from './driver-view';
@Injectable()
export class DriversService {
 constructor(private readonly prisma: PrismaService) {}
 private fail(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
   if (error.code === 'P2002') throw new ConflictException('El DNI o la cuenta vinculada ya pertenece a otro conductor.');
   if (error.code === 'P2003') throw new BadRequestException('La cuenta vinculada no existe.');
   if (error.code === 'P2025') throw new NotFoundException('Conductor no encontrado.');
   if (['P2021','P2022'].includes(error.code)) throw new ServiceUnavailableException('Gestión de conductores pendiente de habilitación: falta aplicar la migración autorizada.');
  } throw error;
 }
 async list(query: DriverQueryDto, role: string = ROLE_NAMES.administrator) {
  const {page=1,pageSize=20,search,estado}=query;
  const where: Prisma.ConductorWhereInput = { ...(estado ? {estado} : {}), ...(search?.trim() ? {OR:[{nombre_completo:{contains:search.trim(),mode:'insensitive'}},{dni:{contains:search.trim()}}]} : {}) };
  const administrator = role === ROLE_NAMES.administrator;
  try {const [items,total]=await this.prisma.$transaction([this.prisma.conductor.findMany({where,select:driverSelection(administrator),skip:(page-1)*pageSize,take:pageSize,orderBy:[{nombre_completo:'asc'},{conductor_id:'asc'}]}),this.prisma.conductor.count({where})]);return {items:items.map(item=>driverView(item,administrator)),total,page,pageSize};} catch(e){this.fail(e);}
 }
 async get(id: string, role: string = ROLE_NAMES.administrator) {const administrator=role===ROLE_NAMES.administrator;try {const driver=await this.prisma.conductor.findUnique({where:{conductor_id:id},select:driverSelection(administrator)});if(!driver)throw new NotFoundException('Conductor no encontrado.');return driverView(driver,administrator);}catch(e){this.fail(e);}}
 private protectAccount(dto: CreateDriverDto | UpdateDriverDto, role: string) {
  if (dto.usuario_id !== undefined && role !== ROLE_NAMES.administrator) throw new ForbiddenException('Solo el Administrador puede gestionar cuentas de acceso.');
 }
 async create(dto: CreateDriverDto, role: string = ROLE_NAMES.administrator) {
  this.protectAccount(dto,role);
  if(dto.usuario_id)throw new BadRequestException('Usa las acciones administrativas de cuenta para vincular el usuario con rol Conductor.');
  const {usuario_id,...data}=dto;void usuario_id;
  try{return await this.prisma.$transaction(async tx=>driverView(await tx.conductor.create({data:{...data,estado:dto.estado??'ACTIVO'},select:driverSelection(role===ROLE_NAMES.administrator)}),role===ROLE_NAMES.administrator));}catch(e){this.fail(e);}
 }
 async update(id:string,dto:UpdateDriverDto, role: string = ROLE_NAMES.administrator) {
  this.protectAccount(dto,role);
  if(!Object.keys(dto).length)throw new BadRequestException('Indica al menos un campo para actualizar.');
  try{return await this.prisma.$transaction(async tx=>{const current=await tx.conductor.findUnique({where:{conductor_id:id}});if(!current)throw new NotFoundException('Conductor no encontrado.');if(dto.usuario_id!==undefined && dto.usuario_id!==current.usuario_id)throw new BadRequestException('Usa la acción de vinculación con confirmación. Este formulario no cambia ni elimina cuentas.');const {usuario_id,...data}=dto;void usuario_id;return driverView(await tx.conductor.update({where:{conductor_id:id},data,select:driverSelection(role===ROLE_NAMES.administrator)}),role===ROLE_NAMES.administrator);});}catch(e){this.fail(e);}
 }
}
