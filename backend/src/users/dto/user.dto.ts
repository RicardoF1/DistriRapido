import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleDto } from '../../auth/dto/auth-response.dto';
export const USER_STATES = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] as const;
const normalizeEmail = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
export class CreateUserDto {
  @ApiProperty({ format: 'email' }) @Transform(normalizeEmail) @IsEmail() @MaxLength(255) email!: string;
  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true }) @IsString() @MinLength(12) @MaxLength(128) password!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() rol_id!: string;
  @ApiPropertyOptional({ enum: USER_STATES, default: 'ACTIVO' }) @ValidateIf((_, value) => value !== undefined) @IsIn(USER_STATES) estado?: string;
}
export class UpdateUserDto {
  @ApiPropertyOptional({ format: 'email' }) @ValidateIf((_, value) => value !== undefined) @Transform(normalizeEmail) @IsEmail() @MaxLength(255) email?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_, value) => value !== undefined) @IsUUID() rol_id?: string;
  @ApiPropertyOptional({ enum: USER_STATES }) @ValidateIf((_, value) => value !== undefined) @IsIn(USER_STATES) estado?: string;
}
export class PublicUserDto {
  @ApiProperty({ format: 'uuid' }) usuario_id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ format: 'uuid' }) rol_id!: string;
  @ApiProperty({ enum: USER_STATES }) estado!: string;
  @ApiProperty({ format: 'date-time' }) creado_en!: Date;
  @ApiProperty({ type: RoleDto }) rol!: RoleDto;
}
