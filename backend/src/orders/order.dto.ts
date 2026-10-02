import { Type, Transform } from 'class-transformer';
import { IsDefined, IsIn, IsISO8601, IsNumber, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateBy, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
function DecimalScale(scale: number) {
  return ValidateBy({ name: 'decimalScale', validator: {
    validate: (value: unknown) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return false;
      const [mantissa, exponent = '0'] = value.toString().toLowerCase().split('e');
      const fraction = mantissa.split('.')[1]?.length ?? 0;
      return Math.max(0, fraction - Number(exponent)) <= scale;
    },
    defaultMessage: () => `$property admite como máximo ${scale} decimales.`,
  } });
}
export const ORDER_PRIORITIES = ['EXPRESS', 'ESTANDAR', 'ECONOMICO'] as const;
export const PRODUCT_TYPES = ['PERECEDERO', 'NO_PERECEDERO'] as const;
export class OrderClientDto {
  @ApiPropertyOptional({ maxLength: 255 }) @IsOptional() @Transform(trim) @IsString() @MaxLength(255) referencia?: string;
  @ApiProperty({ maxLength: 150 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(150) nombre!: string;
  @ApiProperty({ maxLength: 255 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) direccion!: string;
  @ApiProperty({ minimum: -90, maximum: 90, description: 'Hasta 6 decimales.' }) @IsNumber() @DecimalScale(6) @Min(-90) @Max(90) latitud!: number;
  @ApiProperty({ minimum: -180, maximum: 180, description: 'Hasta 6 decimales.' }) @IsNumber() @DecimalScale(6) @Min(-180) @Max(180) longitud!: number;
}
export class CreateOrderDto {
  @ApiPropertyOptional({ maxLength: 255, description: 'Descripción de la carga; sin estimaciones automáticas.' }) @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) descripcion_carga?: string;
  @ApiProperty({ type: OrderClientDto, description: 'Datos mínimos para crear Cliente dentro de la transacción; su UUID se asigna a Pedido.' }) @IsDefined() @IsObject() @ValidateNested() @Type(() => OrderClientDto) cliente!: OrderClientDto;
  @ApiProperty({ minimum: 0.01, maximum: 99999999.99, description: 'kg; NUMERIC(10,2), máximo 2 decimales.' }) @IsNumber() @DecimalScale(2) @Min(0.01) @Max(99999999.99) peso_kg!: number;
  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0.001, maximum: 9999999.999, description: 'm³ conocidos; omitido o null significa desconocido. Máximo 3 decimales.' }) @IsOptional() @IsNumber() @DecimalScale(3) @Min(0.001) @Max(9999999.999) volumen_m3?: number | null;
  @ApiProperty({ format: 'date-time', description: 'ISO 8601 con Z o desplazamiento horario.' }) @IsISO8601({ strict: true }) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/) ventana_inicio!: string;
  @ApiProperty({ format: 'date-time', description: 'Posterior a ventana_inicio, con zona horaria.' }) @IsISO8601({ strict: true }) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/) ventana_fin!: string;
  @ApiProperty({ enum: ORDER_PRIORITIES }) @IsIn(ORDER_PRIORITIES) prioridad!: string;
  @ApiProperty({ enum: PRODUCT_TYPES }) @IsIn(PRODUCT_TYPES) tipo_producto!: string;
}
export class RegisteredOrderDto {
  @ApiProperty({ format: 'uuid' }) pedido_id!: string;
  @ApiProperty({ format: 'uuid' }) cliente_id!: string;
  @ApiProperty({ type: String, description: 'Decimal exacto serializado como cadena, en kg.' }) peso_kg!: string;
  @ApiProperty({ type: String, nullable: true, description: 'Decimal exacto en m³, o null si es desconocido.' }) volumen_m3!: string | null;
  @ApiProperty({ type: String, nullable: true, maxLength: 255 }) descripcion_carga!: string | null;
  @ApiProperty({ format: 'date-time' }) ventana_inicio!: Date;
  @ApiProperty({ format: 'date-time' }) ventana_fin!: Date;
  @ApiProperty({ enum: ORDER_PRIORITIES }) prioridad!: string;
  @ApiProperty({ enum: PRODUCT_TYPES }) tipo_producto!: string;
  @ApiProperty({ enum: ['PENDIENTE'], readOnly: true }) estado!: string;
  @ApiProperty({ format: 'date-time', readOnly: true }) creado_en!: Date;
}
