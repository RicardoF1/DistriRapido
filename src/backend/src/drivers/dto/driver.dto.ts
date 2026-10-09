import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsString, IsUUID, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { DriverDataDto } from './driver-data.dto';
export class CreateDriverDto extends DriverDataDto {
 @ApiPropertyOptional({ nullable: true, format: 'uuid' }) @ValidateIf((_, v) => v !== undefined && v !== null) @IsUUID() usuario_id?: string | null;
 @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'] }) @ValidateIf((_, v) => v !== undefined) @IsIn(['ACTIVO', 'INACTIVO']) estado?: string;
}
export class UpdateDriverDto extends PartialType(CreateDriverDto, { skipNullProperties: false }) {}
export class DriverQueryDto {
 @ApiPropertyOptional() @ValidateIf((_, v) => v !== undefined) @Transform(({value}) => Number(value)) @IsInt() @Min(1) @Max(1000000) page = 1;
 @ApiPropertyOptional() @ValidateIf((_, v) => v !== undefined) @Transform(({value}) => Number(value)) @IsInt() @Min(1) @Max(100) pageSize = 20;
 @ApiPropertyOptional() @ValidateIf((_, v) => v !== undefined) @IsString() @MaxLength(150) search?: string;
 @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'] }) @ValidateIf((_, v) => v !== undefined) @IsIn(['ACTIVO', 'INACTIVO']) estado?: string;
}
