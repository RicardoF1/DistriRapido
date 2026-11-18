import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { routingDatabaseError } from '../planning/planning-data';
import { RegisterSustainabilityDto } from './dto/register-sustainability.dto';

/** Información ambiental obligatoria y el nombre con que se le indica al usuario (US-021, escenario 2). */
export const REQUIRED_SUSTAINABILITY_FIELDS = [
  ['distancia_km', 'distancia recorrida (km)'],
  ['combustible_l', 'combustible consumido (L)'],
  ['factor_emision_kg_co2_km', 'factor de emisión (kg CO₂/km)'],
  ['origen_datos', 'origen de los datos'],
] as const satisfies readonly (readonly [keyof RegisterSustainabilityDto, string])[];

/** Solo una ruta revisada y confirmada (US-020) o en cualquier etapa posterior tiene datos que evaluar. */
export const REGISTRABLE_ROUTE_STATES = ['CONFIRMADA', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA'];

export const SUSTAINABILITY_RESULT = {
  registro_id: true, ruta_id: true, ruta_version: true, distancia_km: true, combustible_l: true,
  factor_emision_kg_co2_km: true, emisiones_co2_kg: true, origen_datos: true, costo_combustible: true,
  observaciones: true, registrado_en: true,
  vehiculo: { select: { vehiculo_id: true, placa: true } },
  registrador: { select: { email: true } },
} satisfies Prisma.RegistroSostenibilidadSelect;

const DUPLICATE = 'La ruta ya tiene información de sostenibilidad registrada.';
/** Un dato medido solo existe cuando la operación terminó; antes solo puede haber estimaciones. */
export const MEASURED_ROUTE_STATE = 'COMPLETADA';
export const MEASURED_REQUIRES_COMPLETED = 'Los datos medidos solo se pueden registrar cuando la ruta está completada. Registra datos estimados o espera a que la ruta termine.';

/** Campos obligatorios ausentes, en el orden del formulario. */
export function missingSustainabilityFields(dto: RegisterSustainabilityDto) {
  return REQUIRED_SUSTAINABILITY_FIELDS.filter(([field]) => dto[field] === undefined || dto[field] === null);
}

/** RN-009: emisiones estimadas = actividad de transporte (km) × factor de emisión (kg CO₂/km). */
export function estimatedEmissions(distanceKm: number, factor: number) {
  return new Prisma.Decimal(distanceKm).times(factor).toDecimalPlaces(4);
}

@Injectable()
export class RouteSustainabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** US-021: registra una sola vez la información ambiental asociada a la ruta y a su versión actual. */
  async register(id: string, dto: RegisterSustainabilityDto, actorId: string) {
    const missing = missingSustainabilityFields(dto);
    if (missing.length) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        code: 'INFORMACION_INSUFICIENTE',
        message: `No se registró la información de sostenibilidad. Falta: ${missing.map(([, label]) => label).join(', ')}.`,
        campos_requeridos: missing.map(([field]) => field),
      });
    }
    const observations = dto.observaciones?.trim() || null;
    try {
      return await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT ruta_id FROM rutas WHERE ruta_id=${id}::uuid FOR UPDATE`;
        const route = await tx.ruta.findUnique({
          where: { ruta_id: id },
          select: {
            estado: true,
            sostenibilidad: { select: { registro_id: true } },
            versiones: { orderBy: { numero: 'desc' }, take: 1, select: { numero: true, vehiculo_id: true } },
          },
        });
        if (!route) throw new NotFoundException('Ruta no encontrada.');
        if (!REGISTRABLE_ROUTE_STATES.includes(route.estado)) {
          throw new ConflictException('Confirma la ruta antes de registrar su información de sostenibilidad.');
        }
        if (dto.origen_datos === 'MEDIDO' && route.estado !== MEASURED_ROUTE_STATE) throw new ConflictException(MEASURED_REQUIRES_COMPLETED);
        if (route.sostenibilidad) throw new ConflictException(DUPLICATE);
        const [version] = route.versiones;
        if (!version) throw new ConflictException('La ruta no tiene una versión calculada a la que asociar la información.');
        return tx.registroSostenibilidad.create({
          data: {
            ruta_id: id,
            ruta_version: version.numero,
            vehiculo_id: version.vehiculo_id,
            distancia_km: dto.distancia_km!,
            combustible_l: dto.combustible_l!,
            factor_emision_kg_co2_km: dto.factor_emision_kg_co2_km!,
            emisiones_co2_kg: estimatedEmissions(dto.distancia_km!, dto.factor_emision_kg_co2_km!),
            origen_datos: dto.origen_datos!,
            costo_combustible: dto.costo_combustible ?? null,
            observaciones: observations,
            registrado_por: actorId,
          },
          select: SUSTAINABILITY_RESULT,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 3000 });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002') throw new ConflictException(DUPLICATE);
      routingDatabaseError(cause);
    }
  }
}
