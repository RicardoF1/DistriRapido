import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthRequest } from '../auth/jwt-auth.guard';
@Injectable()
export class PlanningGuard implements CanActivate {
  canActivate(context: ExecutionContext) { const role = context.switchToHttp().getRequest<AuthRequest>().user?.rol.nombre; if (!['Administrador', 'Operador / Técnico'].includes(role)) throw new ForbiddenException('No tienes permisos para planificar o consultar rutas.'); return true; }
}
