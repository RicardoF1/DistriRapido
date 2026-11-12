import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLE_NAMES } from '../roles/roles';
import type { AuthRequest } from '../auth/jwt-auth.guard';

// US-019: el actor «Supervisor» de RF-016 se ejerce con los roles existentes
// Administrador y Operador / Técnico (decisión documentada en la evidencia de US-019).
export const OPERATIONS_ROLES: readonly string[] = [ROLE_NAMES.administrator, ROLE_NAMES.operator];

@Injectable()
export class OperationsGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const role = context.switchToHttp().getRequest<AuthRequest>().user?.rol.nombre;
    if (!role || !OPERATIONS_ROLES.includes(role)) throw new ForbiddenException('No tienes permisos para consultar el seguimiento operativo.');
    return true;
  }
}
