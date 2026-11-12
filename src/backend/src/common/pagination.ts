import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Green IT (área 2): tamaño de página común a todos los listados (bloques controlados de 12 registros).
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(MAX_PAGE_SIZE)
  pageSize = DEFAULT_PAGE_SIZE;
}

export const pageWindow = (page: number, pageSize: number) => ({ skip: (page - 1) * pageSize, take: pageSize });
