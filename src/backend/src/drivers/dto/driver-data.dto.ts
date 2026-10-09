import { Transform } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

// RF-006 / US-008 / HGR-26: common documented fields, without unapproved operational rules.
export class DriverDataDto {
  @ApiProperty({ maxLength: 150 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(150)
  nombre_completo!: string;

  @ApiProperty({ maxLength: 20 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(20)
  dni!: string;

  @ApiProperty({ maxLength: 20 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(20)
  licencia_categoria!: string;

  @ApiProperty({ minimum: 0, maximum: 32767 }) @IsInt() @Min(0) @Max(32767)
  anios_experiencia!: number;

  @ApiProperty({ maxLength: 30 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(30)
  telefono!: string;
}
