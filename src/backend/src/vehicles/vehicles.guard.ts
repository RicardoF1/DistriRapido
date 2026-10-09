import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUserDto } from '../auth/dto/auth-response.dto';
import { ROLE_NAMES } from '../roles/roles';
@Injectable()
export class VehiclesGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest<Request & { user?: AuthUserDto }>().user;
    if (!user || user.rol.nombre !== ROLE_NAMES.administrator) throw new ForbiddenException('No tienes permisos para gestionar vehículos.');
    return true;
  }
}
