import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, Equals, IsArray, IsBoolean, IsDateString, IsDefined, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
export class PeriodDto {
  @IsDateString() inicio!: string;
  @IsDateString() fin!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class OriginDto {
  @IsNumber({ maxDecimalPlaces: 6 }) @Min(-90) @Max(90) latitud!: number;
  @IsNumber({ maxDecimalPlaces: 6 }) @Min(-180) @Max(180) longitud!: number;
  @IsString() @MinLength(1) @MaxLength(150) label!: string;
}
export class OrderedOrderDto {
  @IsUUID() pedido_id!: string;
  @IsInt() @Min(0) @Max(480) service_minutes!: number;
}
export class PreparePlanningDto {
  @IsString() @MinLength(1) @MaxLength(100) etiqueta!: string;
  @IsDefined() @ValidateNested() @Type(() => OriginDto) origin!: OriginDto;
  @IsBoolean() return_to_origin!: boolean;
  @Equals(true) confirm_origin!: boolean;
  @Equals(true) confirm_order!: boolean;
  @Equals(true) confirm_return!: boolean;
  @IsDateString() inicio!: string;
  @IsDateString() fin!: string;
  @IsUUID() vehiculo_id!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ArrayUnique() @IsUUID(undefined, { each: true }) conductor_ids!: string[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => OrderedOrderDto) orders!: OrderedOrderDto[];
}
export class UpdatePlanningDto extends PreparePlanningDto {
  @IsInt() @Min(1) expected_version!: number;
}
export class CalculatePlanningDto {
  @IsInt() @Min(1) expected_version!: number;
  @Equals(true) confirm_origin!: boolean;
  @Equals(true) confirm_order!: boolean;
  @Equals(true) confirm_return!: boolean;
}
