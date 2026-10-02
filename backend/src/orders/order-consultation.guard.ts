import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLE_NAMES } from '../roles/roles';
import type { AuthUserDto } from '../auth/dto/auth-response.dto';
@Injectable()
export class OrderConsultationGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest<{ user?: AuthUserDto }>().user;
    if (!user || ![ROLE_NAMES.administrator, ROLE_NAMES.operator].some(role => role === user.rol.nombre)) throw new ForbiddenException('No tienes permisos para consultar pedidos.');
    return true;
  }
}
