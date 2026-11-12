import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../../common/pagination';

// US-019 / RF-016: filtros permitidos del seguimiento operativo.
export const OPERATIONAL_ROUTE_STATES = ['ASIGNADA', 'EN_CURSO', 'COMPLETADA'] as const;
export type OperationalRouteState = typeof OPERATIONAL_ROUTE_STATES[number];
export const DELIVERY_STATES = ['PENDIENTE', 'ENTREGADA', 'NO_ENTREGADA'] as const;
export type DeliveryState = typeof DELIVERY_STATES[number];

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const trimToUndefined = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() || undefined : value;

export class OperationsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt({ message: 'page debe ser un entero.' }) @Min(1, { message: 'page debe ser mayor o igual a 1.' }) @Max(1000000)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: DEFAULT_PAGE_SIZE })
  @IsOptional() @Type(() => Number) @IsInt({ message: 'pageSize debe ser un entero.' }) @Min(1, { message: 'pageSize debe estar entre 1 y 50.' }) @Max(50, { message: 'pageSize debe estar entre 1 y 50.' })
  pageSize = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ enum: OPERATIONAL_ROUTE_STATES })
  @IsOptional() @IsIn(OPERATIONAL_ROUTE_STATES, { message: 'estado: usa ASIGNADA, EN_CURSO o COMPLETADA.' })
  estado?: OperationalRouteState;

  @ApiPropertyOptional({ enum: DELIVERY_STATES, description: 'Rutas con al menos una entrega en este estado.' })
  @IsOptional() @IsIn(DELIVERY_STATES, { message: 'estado_entrega: usa PENDIENTE, ENTREGADA o NO_ENTREGADA.' })
  estado_entrega?: DeliveryState;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID('all', { message: 'conductor_id debe ser un identificador válido.' })
  conductor_id?: string;

  @ApiPropertyOptional({ description: 'Fecha de asignación desde (YYYY-MM-DD, America/Lima).' })
  @IsOptional() @Matches(DATE, { message: 'desde debe tener el formato AAAA-MM-DD.' })
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha de asignación hasta, inclusive (YYYY-MM-DD, America/Lima).' })
  @IsOptional() @Matches(DATE, { message: 'hasta debe tener el formato AAAA-MM-DD.' })
  hasta?: string;

  @ApiPropertyOptional({ enum: ['true'], description: 'Solo rutas con incidencias registradas.' })
  @IsOptional() @IsIn(['true', 'false'], { message: 'con_incidencias debe ser true o false.' })
  con_incidencias?: 'true' | 'false';

  @ApiPropertyOptional({ maxLength: 100, description: 'Placa del vehículo o nombre del conductor.' })
  @Transform(trimToUndefined) @IsOptional() @IsString() @MaxLength(100, { message: 'search admite como máximo 100 caracteres.' })
  search?: string;
}
