import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthRequest } from '../auth/jwt-auth.guard';
import { ROLE_NAMES } from '../roles/roles';

@Injectable()
export class AvailabilityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request =
      context.switchToHttp().getRequest<AuthRequest>();

    const user = request.user;

    const authorizedRoles = [
      ROLE_NAMES.administrator,
      ROLE_NAMES.operator,
    ];

    if (
      !user ||
      !authorizedRoles.some(
        (role) => role === user.rol.nombre,
      )
    ) {
      throw new ForbiddenException(
        'No tienes permisos para gestionar la disponibilidad operativa.',
      );
    }

    return true;
  }
}
