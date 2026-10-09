import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const AVAILABILITY_STATES = [
  'DISPONIBLE',
  'NO_DISPONIBLE',
] as const;

export type AvailabilityState =
  (typeof AVAILABILITY_STATES)[number];

export class CreateAvailabilityDto {
  @ApiProperty({ format: 'uuid' })
  @Transform(trim)
  @IsUUID()
  conductor_id!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-10T08:00:00-05:00',
  })
  @IsDateString()
  inicio!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-10T17:00:00-05:00',
  })
  @IsDateString()
  fin!: string;

  @ApiPropertyOptional({
    enum: AVAILABILITY_STATES,
    default: 'DISPONIBLE',
  })
  @IsOptional()
  @IsIn(AVAILABILITY_STATES)
  estado?: AvailabilityState;
}

export class UpdateAvailabilityDto extends PartialType(
  CreateAvailabilityDto,
) {}

export class AvailabilityQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Transform(trim)
  @IsUUID()
  conductor_id?: string;

  @ApiPropertyOptional({ enum: AVAILABILITY_STATES })
  @IsOptional()
  @IsIn(AVAILABILITY_STATES)
  estado?: AvailabilityState;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  fin?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
