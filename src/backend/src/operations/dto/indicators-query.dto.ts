import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

// US-022 / RF-020: periodo de los indicadores, en días completos de America/Lima.
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export class IndicatorsQueryDto {
  @ApiPropertyOptional({ description: 'Primer día del periodo (YYYY-MM-DD, America/Lima). Por defecto, 29 días antes de «hasta».' })
  @IsOptional() @Matches(DATE, { message: 'desde debe tener el formato AAAA-MM-DD.' })
  desde?: string;

  @ApiPropertyOptional({ description: 'Último día del periodo, inclusive (YYYY-MM-DD, America/Lima). Por defecto, hoy.' })
  @IsOptional() @Matches(DATE, { message: 'hasta debe tener el formato AAAA-MM-DD.' })
  hasta?: string;
}
