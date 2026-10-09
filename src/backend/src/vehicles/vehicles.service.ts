import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.vehiculo.findMany({ orderBy: [{ placa: 'asc' }, { vehiculo_id: 'asc' }] }); }
  async get(id: string) {
    const vehicle = await this.prisma.vehiculo.findUnique({ where: { vehiculo_id: id } });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado.');
    return vehicle;
  }
  async create(dto: CreateVehicleDto) {
    try { return await this.prisma.vehiculo.create({ data: { ...dto, capacidad_volumen_m3: dto.capacidad_volumen_m3 ?? null, estado: dto.estado ?? 'DISPONIBLE' } }); }
    catch (cause) { this.translate(cause); throw cause; }
  }
  async update(id: string, dto: UpdateVehicleDto) {
    if (!Object.values(dto).some(value => value !== undefined)) throw new BadRequestException('Debe indicar al menos un atributo para actualizar.');
    try { return await this.prisma.vehiculo.update({ where: { vehiculo_id: id }, data: dto }); }
    catch (cause) { this.translate(cause); throw cause; }
  }
  private translate(cause: unknown): void {
    if (!(cause instanceof Prisma.PrismaClientKnownRequestError)) return;
    if (cause.code === 'P2002') throw new ConflictException('La placa ya está registrada.');
    if (cause.code === 'P2025') throw new NotFoundException('Vehículo no encontrado.');
    if (cause.code === 'P2003') throw new ConflictException('No se pudo guardar el vehículo por una restricción relacionada.');
  }
}
