import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ROLE_NAMES } from '../roles/roles';
import { ACCOUNT_FIELDS, driverSelection, driverView } from './driver-view';
import { CreateDriverAccountDto, DriverAccountOptionsDto, LinkDriverAccountDto } from './dto/driver-account.dto';

@Injectable()
export class DriverAccountsService {
  constructor(private readonly prisma: PrismaService, private readonly users: UsersService) {}
  private async driver(tx: Prisma.TransactionClient, id: string) {
    const row = await tx.conductor.findUnique({ where: { conductor_id: id }, select: driverSelection(true) });
    if (!row) throw new NotFoundException('Conductor no encontrado.');
    return row;
  }
  private async write<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    try { return await this.prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 }); }
    catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError) {
        if (['P2034', 'P2028'].includes(cause.code)) throw new ConflictException('La cuenta o el vínculo cambió durante la operación. Recarga antes de reintentar.');
        if (cause.code === 'P2002') throw new ConflictException('La cuenta ya está vinculada o el correo ya existe.');
        if (cause.code === 'P2003') throw new BadRequestException('La cuenta seleccionada ya no existe.');
      }
      throw cause;
    }
  }
  async options(query: DriverAccountOptionsDto) {
    if (query.conductor_id) await this.driver(this.prisma, query.conductor_id);
    const where: Prisma.UsuarioWhereInput = {
      rol: { nombre: ROLE_NAMES.driver }, estado: 'ACTIVO',
      ...(query.search?.trim() ? { email: { contains: query.search.trim(), mode: 'insensitive' } } : {}),
      OR: [{ conductor: { is: null } }, ...(query.conductor_id ? [{ conductor: { is: { conductor_id: query.conductor_id } } }] : [])],
    };
    const { page = 1, pageSize = 20 } = query;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({ where, select: ACCOUNT_FIELDS, orderBy: [{ email: 'asc' }, { usuario_id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.usuario.count({ where }),
    ]);
    return { items: items.map(a => ({ usuario_id: a.usuario_id, email: a.email, estado: a.estado })), total, page, pageSize };
  }
  link(id: string, dto: LinkDriverAccountDto) {
    return this.write(async tx => {
      const current = await this.driver(tx, id);
      if (current.usuario_id !== dto.expected_usuario_id) throw new ConflictException('El vínculo cambió. Recarga la ficha antes de confirmar.');
      if (current.usuario_id === dto.usuario_id) return driverView(current, true);
      if (current.usuario_id && dto.confirm_replacement !== true) throw new ConflictException('Confirma explícitamente la sustitución de la cuenta vinculada.');
      const account = await tx.usuario.findUnique({ where: { usuario_id: dto.usuario_id }, select: { usuario_id: true, estado: true, rol: { select: { nombre: true } }, conductor: { select: { conductor_id: true } } } });
      if (!account || account.estado !== 'ACTIVO' || account.rol.nombre !== ROLE_NAMES.driver) throw new BadRequestException('Selecciona una cuenta activa con rol Usuario Final / Conductor.');
      if (account.conductor && account.conductor.conductor_id !== id) throw new ConflictException('La cuenta ya pertenece a otro conductor.');
      const result = await tx.conductor.updateMany({ where: { conductor_id: id, usuario_id: dto.expected_usuario_id }, data: { usuario_id: dto.usuario_id } });
      if (result.count !== 1) throw new ConflictException('El vínculo cambió. Recarga la ficha.');
      return driverView(await this.driver(tx, id), true);
    });
  }
  create(id: string, dto: CreateDriverAccountDto) {
    return this.write(async tx => {
      const current = await this.driver(tx, id);
      if (current.usuario_id) throw new ConflictException('El conductor ya tiene cuenta. No se creará ni sustituirá automáticamente.');
      const role = await tx.rol.findUnique({ where: { nombre: ROLE_NAMES.driver } });
      if (!role) throw new BadRequestException('El rol de conductor no está disponible.');
      const account = await this.users.create({ email: dto.email, password: dto.password, rol_id: role.rol_id, estado: 'ACTIVO' }, tx);
      const result = await tx.conductor.updateMany({ where: { conductor_id: id, usuario_id: null }, data: { usuario_id: account.usuario_id } });
      if (result.count !== 1) throw new ConflictException('El vínculo cambió. No se creó ninguna cuenta parcial.');
      return driverView(await this.driver(tx, id), true);
    });
  }
}
