import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { isAllowedRole, ROLE_NAMES } from '../roles/roles';
export const PUBLIC_USER_SELECT = { usuario_id: true, email: true, rol_id: true, estado: true, creado_en: true, rol: { select: { rol_id: true, nombre: true } } } satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email }, include: { rol: true } });
  }
  findById(usuario_id: string) {
    return this.prisma.usuario.findUnique({ where: { usuario_id }, include: { rol: true } });
  }
  list() { return this.prisma.usuario.findMany({ select: PUBLIC_USER_SELECT, orderBy: [{ creado_en: 'desc' }, { usuario_id: 'asc' }] }); }
  async get(usuario_id: string) {
    const user = await this.prisma.usuario.findUnique({ where: { usuario_id }, select: PUBLIC_USER_SELECT });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }
  private async checkRole(rol_id: string, db: Prisma.TransactionClient = this.prisma) {
    const role = await db.rol.findUnique({ where: { rol_id } });
    if (!role || !isAllowedRole(role.nombre)) throw new BadRequestException('Selecciona un rol existente y permitido.');
    return role;
  }
  private databaseError(cause: unknown): never {
    if (cause instanceof Prisma.PrismaClientKnownRequestError) {
      if (cause.code === 'P2002') throw new ConflictException('Ya existe un usuario con ese correo electrónico.');
      if (cause.code === 'P2003') throw new BadRequestException('Selecciona un rol existente y permitido.');
      if (cause.code === 'P2025') throw new NotFoundException('Usuario no encontrado.');
      if (cause.code === 'P2034') throw new ConflictException('La cuenta cambió durante la operación. Recarga antes de reintentar.');
    }
    throw cause;
  }
  async create(dto: CreateUserDto, db: Prisma.TransactionClient = this.prisma) {
    await this.checkRole(dto.rol_id, db);
    const password_hash = await argon2.hash(dto.password, { type: argon2.argon2id });
    try { return await db.usuario.create({ data: { email: dto.email, rol_id: dto.rol_id, estado: dto.estado ?? 'ACTIVO', password_hash }, select: PUBLIC_USER_SELECT }); }
    catch (cause) { this.databaseError(cause); }
  }
  async update(usuario_id: string, dto: UpdateUserDto) {
    if (Object.values(dto).every((value) => value === undefined)) throw new BadRequestException('Indica al menos un atributo para modificar.');
    await this.get(usuario_id);
    if (dto.rol_id !== undefined) {
      try { return await this.prisma.$transaction(async tx => {
        const role = await this.checkRole(dto.rol_id!, tx);
        const linked = await tx.conductor.findUnique({ where: { usuario_id }, select: { conductor_id: true } });
        if (linked && role.nombre !== ROLE_NAMES.driver) throw new ConflictException('Una cuenta vinculada a un conductor debe conservar su rol de conductor.');
        return tx.usuario.update({ where: { usuario_id }, data: { ...dto }, select: PUBLIC_USER_SELECT });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
      catch (cause) { this.databaseError(cause); }
    }
    try { return await this.prisma.usuario.update({ where: { usuario_id }, data: { ...dto }, select: PUBLIC_USER_SELECT }); }
    catch (cause) { this.databaseError(cause); }
  }
}
