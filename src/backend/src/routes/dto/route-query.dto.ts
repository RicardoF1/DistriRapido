import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../../common/pagination';
export class RouteQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = DEFAULT_PAGE_SIZE;
  @IsOptional() @IsUUID() planificacion_id?: string;
  @IsOptional() @IsUUID() alternativa_id?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsIn(['SECUENCIAL_OSRM']) metodo?: string;
  @IsOptional() @IsDateString() desde?: string;
  @IsOptional() @IsDateString() hasta?: string;
}
