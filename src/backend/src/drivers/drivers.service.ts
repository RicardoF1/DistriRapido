import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../roles/roles';
import { CreateDriverDto, DriverQueryDto, UpdateDriverDto } from './dto/driver.dto';
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
 async list(query: DriverQueryDto) {
  const {page=1,pageSize=20,search,estado}=query;
  const where: Prisma.ConductorWhereInput = { ...(estado ? {estado} : {}), ...(search?.trim() ? {OR:[{nombre_completo:{contains:search.trim(),mode:'insensitive'}},{dni:{contains:search.trim()}}]} : {}) };
  try {const [items,total]=await this.prisma.$transaction([this.prisma.conductor.findMany({where,skip:(page-1)*pageSize,take:pageSize,orderBy:[{nombre_completo:'asc'},{conductor_id:'asc'}]}),this.prisma.conductor.count({where})]);return {items,total,page,pageSize};} catch(e){this.fail(e);}
 }
 async get(id: string) {try {const driver=await this.prisma.conductor.findUnique({where:{conductor_id:id}});if(!driver)throw new NotFoundException('Conductor no encontrado.');return driver;}catch(e){this.fail(e);}}
 private async account(tx: Prisma.TransactionClient, id: string | null | undefined) {
  if(!id)return; const user=await tx.usuario.findUnique({where:{usuario_id:id},select:{rol:{select:{nombre:true}}}});
  if(!user || user.rol.nombre!==ROLE_NAMES.driver)throw new BadRequestException('Vincula una cuenta existente con rol Usuario Final / Conductor.');
 }
 async create(dto: CreateDriverDto) {try{return await this.prisma.$transaction(async tx=>{await this.account(tx,dto.usuario_id);return tx.conductor.create({data:{...dto,estado:dto.estado??'ACTIVO'}});});}catch(e){this.fail(e);}}
 async update(id:string,dto:UpdateDriverDto) {
  if(!Object.keys(dto).length)throw new BadRequestException('Indica al menos un campo para actualizar.');
  try{return await this.prisma.$transaction(async tx=>{const current=await tx.conductor.findUnique({where:{conductor_id:id}});if(!current)throw new NotFoundException('Conductor no encontrado.');await this.account(tx,dto.usuario_id===undefined?current.usuario_id:dto.usuario_id);return tx.conductor.update({where:{conductor_id:id},data:dto});});}catch(e){this.fail(e);}
 }
}
