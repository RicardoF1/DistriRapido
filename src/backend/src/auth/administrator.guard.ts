import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLE_NAMES } from '../roles/roles';
import type { AuthRequest } from './jwt-auth.guard';
@Injectable()
export class AdministratorGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest<AuthRequest>().user.rol.nombre !== ROLE_NAMES.administrator) throw new ForbiddenException('Solo el Administrador puede gestionar usuarios y roles.');
    return true;
  }
}
