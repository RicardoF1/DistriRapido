import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { isAllowedRole } from '../roles/roles';
import { PasswordService } from './password.service';
import { LoginDto } from './dto/login.dto';
import { AuthUserDto, SessionIdentityDto } from './dto/auth-response.dto';

export const INVALID_CREDENTIALS = 'Credenciales incorrectas o usuario no habilitado.';
const TOKEN_OPTIONS = { issuer: 'distrirapido', audience: 'distrirapido-web', algorithm: 'HS256' as const };

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const valid = await this.passwords.verify(user?.password_hash ?? null, dto.password);
    if (!user || !valid || user.estado !== 'ACTIVO' || !isAllowedRole(user.rol.nombre)) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const expiresIn = this.config.getOrThrow<number>('JWT_EXPIRES_SECONDS');
    const accessToken = await this.jwt.signAsync({ sub: user.usuario_id }, { ...TOKEN_OPTIONS, expiresIn });
    return { accessToken, tokenType: 'Bearer', expiresIn, user: this.identity(user) };
  }

  async authenticate(token: string): Promise<SessionIdentityDto> {
    let sub: unknown;
    let expiresAt: number;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown; exp?: number }>(token, {
        issuer: TOKEN_OPTIONS.issuer, audience: TOKEN_OPTIONS.audience, algorithms: ['HS256'],
      });
      sub = payload.sub;
      if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) throw new Error('Invalid expiry');
      expiresAt = payload.exp * 1000;
    } catch { throw new UnauthorizedException('Debes iniciar sesión para acceder.'); }
    if (typeof sub !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub)) {
      throw new UnauthorizedException('Debes iniciar sesión para acceder.');
    }
    const user = await this.users.findById(sub);
    if (!user || user.estado !== 'ACTIVO' || !isAllowedRole(user.rol.nombre)) {
      throw new UnauthorizedException('Debes iniciar sesión para acceder.');
    }
    return { ...this.identity(user), expiresAt };
  }

  private identity(user: { usuario_id: string; email: string; rol: { rol_id: string; nombre: string } }): AuthUserDto {
    return { usuario_id: user.usuario_id, email: user.email, rol: { rol_id: user.rol.rol_id, nombre: user.rol.nombre } };
  }
}
