import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../../common/pagination';

// US-023 / RF-021: filtros permitidos del historial de operaciones terminadas.
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const trimToUndefined = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() || undefined : value;

export class HistoryQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt({ message: 'page debe ser un entero.' }) @Min(1, { message: 'page debe ser mayor o igual a 1.' }) @Max(1000000)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: DEFAULT_PAGE_SIZE })
  @IsOptional() @Type(() => Number) @IsInt({ message: 'pageSize debe ser un entero.' }) @Min(1, { message: 'pageSize debe estar entre 1 y 50.' }) @Max(50, { message: 'pageSize debe estar entre 1 y 50.' })
  pageSize = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ description: 'Finalizada desde (YYYY-MM-DD, America/Lima).' })
  @IsOptional() @Matches(DATE, { message: 'desde debe tener el formato AAAA-MM-DD.' })
  desde?: string;

  @ApiPropertyOptional({ description: 'Finalizada hasta, inclusive (YYYY-MM-DD, America/Lima).' })
  @IsOptional() @Matches(DATE, { message: 'hasta debe tener el formato AAAA-MM-DD.' })
  hasta?: string;

  @ApiPropertyOptional({ maxLength: 100, description: 'Placa del vehículo o nombre del conductor.' })
  @Transform(trimToUndefined) @IsOptional() @IsString() @MaxLength(100, { message: 'search admite como máximo 100 caracteres.' })
  search?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'], description: 'Solo operaciones con incidencias registradas.' })
  @IsOptional() @IsIn(['true', 'false'], { message: 'con_incidencias debe ser true o false.' })
  con_incidencias?: 'true' | 'false';

  @ApiPropertyOptional({ enum: ['true', 'false'], description: 'Solo operaciones con alguna entrega no realizada.' })
  @IsOptional() @IsIn(['true', 'false'], { message: 'con_no_entregas debe ser true o false.' })
  con_no_entregas?: 'true' | 'false';
}
