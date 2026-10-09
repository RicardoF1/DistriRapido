import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateBy } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const VEHICLE_STATES = ['DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'AVERIADO', 'INACTIVO'] as const;
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
function DecimalScale(scale: number) {
  return ValidateBy({ name: 'decimalScale', validator: { validate: (value: unknown) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    const [mantissa, exponent = '0'] = value.toString().toLowerCase().split('e');
    return Math.max(0, (mantissa.split('.')[1]?.length ?? 0) - Number(exponent)) <= scale;
  } } });
}

export class CreateVehicleDto {
  @ApiProperty({ maxLength: 15 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(15) placa!: string;
  @ApiProperty({ maxLength: 30 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(30) tipo!: string;
  @ApiProperty({ minimum: 0.01, maximum: 99999999.99 }) @IsNumber() @DecimalScale(2) @Min(0.01) @Max(99999999.99) capacidad_carga_kg!: number;
  @ApiPropertyOptional({ nullable: true, minimum: 0.001, maximum: 9999999.999 }) @IsOptional() @IsNumber() @DecimalScale(3) @Min(0.001) @Max(9999999.999) capacidad_volumen_m3?: number | null;
  @ApiProperty({ minimum: 0.001, maximum: 9999999.999 }) @IsNumber() @DecimalScale(3) @Min(0.001) @Max(9999999.999) consumo_km_l!: number;
  @ApiProperty({ minimum: 0, maximum: 99999.99999 }) @IsNumber() @DecimalScale(5) @Min(0) @Max(99999.99999) factor_emision_kg_co2_km!: number;
  @ApiProperty({ minimum: 1900, maximum: 2100 }) @IsNumber() @Min(1900) @Max(2100) anio_fabricacion!: number;
  @ApiPropertyOptional({ enum: VEHICLE_STATES, default: 'DISPONIBLE' }) @IsOptional() @IsIn(VEHICLE_STATES) estado?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ maxLength: 15 }) @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(15) placa?: string;
  @ApiPropertyOptional({ maxLength: 30 }) @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(30) tipo?: string;
  @ApiPropertyOptional({ minimum: 0.01 }) @IsOptional() @IsNumber() @DecimalScale(2) @Min(0.01) @Max(99999999.99) capacidad_carga_kg?: number;
  @ApiPropertyOptional({ nullable: true, minimum: 0.001 }) @IsOptional() @IsNumber() @DecimalScale(3) @Min(0.001) @Max(9999999.999) capacidad_volumen_m3?: number | null;
  @ApiPropertyOptional({ minimum: 0.001 }) @IsOptional() @IsNumber() @DecimalScale(3) @Min(0.001) @Max(9999999.999) consumo_km_l?: number;
  @ApiPropertyOptional({ minimum: 0 }) @IsOptional() @IsNumber() @DecimalScale(5) @Min(0) @Max(99999.99999) factor_emision_kg_co2_km?: number;
  @ApiPropertyOptional({ minimum: 1900, maximum: 2100 }) @IsOptional() @IsNumber() @Min(1900) @Max(2100) anio_fabricacion?: number;
  @ApiPropertyOptional({ enum: VEHICLE_STATES }) @IsOptional() @IsIn(VEHICLE_STATES) estado?: string;
}
