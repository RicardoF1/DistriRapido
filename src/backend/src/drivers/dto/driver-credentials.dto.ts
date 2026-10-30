import { Equals, IsBoolean, IsInt, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class NewDriverPasswordDto {
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
  @IsString() @MinLength(12) @MaxLength(128) password_confirmation!: string;
}
export class ResetDriverPasswordDto extends NewDriverPasswordDto {
  @IsUUID() expected_usuario_id!: string;
  @IsInt() @Min(0) @Max(2147483646) expected_credentials_version!: number;
  @IsBoolean() @Equals(true) confirmed!: boolean;
}
export class ChangeDriverPasswordDto extends NewDriverPasswordDto {
  @IsString() @MinLength(1) @MaxLength(128) current_password!: string;
}
