import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from './roles';
@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.rol.findMany({ where: { nombre: { in: Object.values(ROLE_NAMES) } }, select: { rol_id: true, nombre: true, descripcion: true }, orderBy: { nombre: 'asc' } }); }
}
