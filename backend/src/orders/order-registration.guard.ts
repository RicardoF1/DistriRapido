import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLE_NAMES } from '../roles/roles';
import type { Request } from 'express';
import type { AuthUserDto } from '../auth/dto/auth-response.dto';
@Injectable()
export class OrderRegistrationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<Request & { user?: AuthUserDto }>().user;
    if (!user || ![ROLE_NAMES.administrator, ROLE_NAMES.operator].some(role => role === user.rol.nombre)) throw new ForbiddenException('No tienes permisos para registrar pedidos.');
    return true;
  }
}
