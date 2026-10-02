import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({ format: 'uuid' }) rol_id!: string;
  @ApiProperty() nombre!: string;
}
export class AuthUserDto {
  @ApiProperty({ format: 'uuid' }) usuario_id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ type: RoleDto }) rol!: RoleDto;
}
export class LoginResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ enum: ['Bearer'] }) tokenType!: string;
  @ApiProperty({ description: 'Vigencia en segundos' }) expiresIn!: number;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}
export class SessionIdentityDto extends AuthUserDto {
  @ApiProperty({ description: 'Caducidad absoluta de la sesión: milisegundos Unix. Recargar no renueva el JWT.' }) expiresAt!: number;
}
