import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
export class DriverAccountOptionsDto {
  @IsOptional() @IsUUID() conductor_id?: string;
  @IsOptional() @IsString() @MaxLength(255) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class LinkDriverAccountDto {
  @IsUUID() usuario_id!: string;
  @ValidateIf((_, value) => value !== null) @IsUUID() expected_usuario_id!: string | null;
  @IsOptional() @IsBoolean() confirm_replacement?: boolean;
}
export class CreateDriverAccountDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(255) email!: string;
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
}
