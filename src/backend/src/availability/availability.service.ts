import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AvailabilityQueryDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private fail(error: unknown): never {
    if (
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe una disponibilidad con el mismo conductor e intervalo.',
        );
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(
          'El conductor seleccionado no existe.',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Registro de disponibilidad no encontrado.',
        );
      }

      if (['P2021', 'P2022'].includes(error.code)) {
        throw new ServiceUnavailableException(
          'La disponibilidad operativa no está habilitada. Verifica la migración de US-009.',
        );
      }
    }

    throw error;
  }

  private validatePeriod(inicio: Date, fin: Date): void {
    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fin.getTime())
    ) {
      throw new BadRequestException(
        'Las fechas de inicio y fin no son válidas.',
      );
    }

    if (fin <= inicio) {
      throw new BadRequestException(
        'La fecha y hora de fin debe ser posterior al inicio.',
      );
    }
  }

  private async validateDriver(
    tx: Prisma.TransactionClient,
    conductorId: string,
  ): Promise<void> {
    const driver = await tx.conductor.findUnique({
      where: { conductor_id: conductorId },
      select: {
        conductor_id: true,
        estado: true,
      },
    });

    if (!driver) {
      throw new NotFoundException('Conductor no encontrado.');
    }

    if (driver.estado !== 'ACTIVO') {
      throw new ConflictException(
        'Solo se puede registrar disponibilidad para conductores activos.',
      );
    }
  }

  private async validateOverlap(
    tx: Prisma.TransactionClient,
    conductorId: string,
    inicio: Date,
    fin: Date,
    excludedId?: string,
  ): Promise<void> {
    const overlapping =
      await tx.disponibilidadConductor.findFirst({
        where: {
          conductor_id: conductorId,
          ...(excludedId
            ? {
                disponibilidad_id: {
                  not: excludedId,
                },
              }
            : {}),
          inicio: { lt: fin },
          fin: { gt: inicio },
        },
        select: {
          disponibilidad_id: true,
        },
      });

    if (overlapping) {
      throw new ConflictException(
        'El conductor ya tiene una disponibilidad que se superpone con el intervalo indicado.',
      );
    }
  }

  async list(query: AvailabilityQueryDto) {
    const {
      conductor_id,
      estado,
      inicio,
      fin,
      page = 1,
      pageSize = 20,
    } = query;

    if (inicio && fin) {
      this.validatePeriod(new Date(inicio), new Date(fin));
    }

    const where: Prisma.DisponibilidadConductorWhereInput = {
      ...(conductor_id ? { conductor_id } : {}),
      ...(estado ? { estado } : {}),
      ...(inicio || fin
        ? {
            inicio: fin ? { lt: new Date(fin) } : undefined,
            fin: inicio ? { gt: new Date(inicio) } : undefined,
          }
        : {}),
    };

    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.disponibilidadConductor.findMany({
          where,
          include: {
            conductor: {
              select: {
                conductor_id: true,
                nombre_completo: true,
                dni: true,
                estado: true,
              },
            },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [
            { inicio: 'asc' },
            { disponibilidad_id: 'asc' },
          ],
        }),
        this.prisma.disponibilidadConductor.count({ where }),
      ]);

      return { items, total, page, pageSize };
    } catch (error) {
      this.fail(error);
    }
  }

  async get(id: string) {
    try {
      const availability =
        await this.prisma.disponibilidadConductor.findUnique({
          where: { disponibilidad_id: id },
          include: { conductor: true },
        });

      if (!availability) {
        throw new NotFoundException(
          'Registro de disponibilidad no encontrado.',
        );
      }

      return availability;
    } catch (error) {
      this.fail(error);
    }
  }

  async create(dto: CreateAvailabilityDto) {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);

    this.validatePeriod(inicio, fin);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.validateDriver(tx, dto.conductor_id);

        await this.validateOverlap(
          tx,
          dto.conductor_id,
          inicio,
          fin,
        );

        return tx.disponibilidadConductor.create({
          data: {
            conductor_id: dto.conductor_id,
            inicio,
            fin,
            estado: dto.estado ?? 'DISPONIBLE',
          },
          include: { conductor: true },
        });
      });
    } catch (error) {
      this.fail(error);
    }
  }

  async update(id: string, dto: UpdateAvailabilityDto) {
    if (!Object.keys(dto).length) {
      throw new BadRequestException(
        'Indica al menos un campo para actualizar.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const current =
          await tx.disponibilidadConductor.findUnique({
            where: { disponibilidad_id: id },
          });

        if (!current) {
          throw new NotFoundException(
            'Registro de disponibilidad no encontrado.',
          );
        }

        const conductorId =
          dto.conductor_id ?? current.conductor_id;

        const inicio = dto.inicio
          ? new Date(dto.inicio)
          : current.inicio;

        const fin = dto.fin
          ? new Date(dto.fin)
          : current.fin;

        this.validatePeriod(inicio, fin);
        await this.validateDriver(tx, conductorId);

        await this.validateOverlap(
          tx,
          conductorId,
          inicio,
          fin,
          id,
        );

        return tx.disponibilidadConductor.update({
          where: { disponibilidad_id: id },
          data: {
            ...(dto.conductor_id
              ? { conductor_id: conductorId }
              : {}),
            ...(dto.inicio ? { inicio } : {}),
            ...(dto.fin ? { fin } : {}),
            ...(dto.estado ? { estado: dto.estado } : {}),
          },
          include: { conductor: true },
        });
      });
    } catch (error) {
      this.fail(error);
    }
  }
}
