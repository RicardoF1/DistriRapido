import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORDER_PRIORITIES, PRODUCT_TYPES, RegisteredOrderDto } from './order.dto';
export const ORDER_STATES = ['PENDIENTE'] as const;
export class OrderQueryDto {
  @ApiPropertyOptional({ description: 'Nombre de cliente, dirección o UUID exacto del pedido.', maxLength: 255 })
  @IsOptional() @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(255) search?: string;
  @ApiPropertyOptional({ enum: ORDER_STATES }) @IsOptional() @IsIn(ORDER_STATES) estado?: string;
  @ApiPropertyOptional({ enum: ORDER_PRIORITIES }) @IsOptional() @IsIn(ORDER_PRIORITIES) prioridad?: string;
  @ApiPropertyOptional({ enum: PRODUCT_TYPES }) @IsOptional() @IsIn(PRODUCT_TYPES) tipo_producto?: string;
  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 100000 }) @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 }) @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class OrderReadClientDto {
  @ApiProperty({ format: 'uuid' }) cliente_id!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty({ type: String, nullable: true }) telefono!: string | null;
  @ApiProperty({ type: String, nullable: true }) email!: string | null;
  @ApiProperty() direccion!: string;
  @ApiProperty({ type: String, nullable: true }) referencia!: string | null;
  @ApiProperty({ type: String }) latitud!: string;
  @ApiProperty({ type: String }) longitud!: string;
  @ApiProperty() estado!: string;
}
export class OrderReadDto extends RegisteredOrderDto {
  @ApiProperty({ type: OrderReadClientDto }) cliente!: OrderReadClientDto;
}
export class OrderPageDto {
  @ApiProperty({ type: [OrderReadDto] }) items!: OrderReadDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
