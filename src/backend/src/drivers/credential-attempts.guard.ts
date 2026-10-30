import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import type { AuthRequest } from '../auth/jwt-auth.guard';

/** Additional actor/target budget. Global IP throttling remains enabled. Single instance. */
@Injectable()
export class CredentialAttemptsGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; until: number }>();
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>(); const now = Date.now();
    for (const [key, value] of this.attempts) if (value.until <= now) this.attempts.delete(key);
    const keys = [`actor:${req.user.usuario_id}`, `target:${req.params.id ?? req.user.usuario_id}`];
    if (keys.some(key => (this.attempts.get(key)?.count ?? 0) >= 5) || this.attempts.size >= 10000) throw new HttpException('Demasiados intentos de cambio de contraseña. Espera un minuto.', 429);
    for (const key of keys) { const entry = this.attempts.get(key) ?? { count: 0, until: now + 60000 }; entry.count++; this.attempts.set(key, entry); }
    return true;
  }
}
