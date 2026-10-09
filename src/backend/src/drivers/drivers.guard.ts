import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthRequest } from '../auth/jwt-auth.guard';
import { ROLE_NAMES } from '../roles/roles';
@Injectable()
export class DriversGuard implements CanActivate {
 canActivate(context: ExecutionContext) { const user = context.switchToHttp().getRequest<AuthRequest>().user;
 if (!user || ![ROLE_NAMES.administrator, ROLE_NAMES.operator].some(role => role === user.rol.nombre)) throw new ForbiddenException('No tienes permisos para gestionar conductores.');
 return true; }
}
