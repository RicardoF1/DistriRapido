import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'administrador@example.com', maxLength: 255, format: 'email' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Introduce un correo electrónico válido.' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ format: 'password', minLength: 1, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(1, { message: 'Introduce tu contraseña.' })
  @MaxLength(128)
  password!: string;
}
