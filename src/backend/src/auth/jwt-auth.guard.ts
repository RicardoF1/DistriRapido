import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SessionIdentityDto } from './dto/auth-response.dto';
import { readSessionCookie, SESSION_COOKIE } from './session-cookie';
export type AuthRequest = Request & { user: SessionIdentityDto; authToken: string; legacySession: boolean };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.headers.authorization;
    const token = authorization === undefined ? readSessionCookie(request.headers.cookie) : /^Bearer ([^\s]+)$/.exec(authorization)?.[1];
    if (!token) throw new UnauthorizedException('Debes iniciar sesión para acceder.');
    request.user = await this.auth.authenticate(token);
    request.authToken = token;
    request.legacySession = authorization === undefined && !request.headers.cookie?.split(';').some((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
    return true;
  }
}
