import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
export function assertRequestOrigin(request: Request, allowed: string) {
  const origin = request.headers.origin;
  const apiOrigin = `${request.protocol}://${request.headers.host}`;
  if ((origin && origin !== allowed && origin !== apiOrigin) || request.headers['sec-fetch-site'] === 'cross-site') throw new ForbiddenException('Origen no permitido.');
}
@Injectable()
export class RequestOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) assertRequestOrigin(request, this.config.getOrThrow<string>('FRONTEND_ORIGIN'));
    return true;
  }
}
