import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof detail === 'string' ? detail :
      detail && typeof detail === 'object' && 'message' in detail ? detail.message : 'No se pudo completar la solicitud.';
    const routing = /^\/(planning|routes)(\/|$)/.test(request.path) && detail && typeof detail === 'object' ? detail as { code?: unknown; execution_id?: unknown; campos_requeridos?: unknown } : null;
    // US-021: la información requerida que falta se expone solo como nombres de campo, nunca como texto libre.
    const required = Array.isArray(routing?.campos_requeridos) && routing.campos_requeridos.length <= 10 && routing.campos_requeridos.every(field => typeof field === 'string' && /^[a-z0-9_]{1,40}$/.test(field)) ? routing.campos_requeridos as string[] : undefined;
    response.status(statusCode).json({ statusCode, message, ...(typeof routing?.code === 'string' && /^(ROUTING_\d{3}|INFORMACION_INSUFICIENTE)$/.test(routing.code) ? { code: routing.code } : {}), ...(typeof routing?.execution_id === 'string' && /^[0-9a-f-]{36}$/i.test(routing.execution_id) ? { execution_id: routing.execution_id } : {}), ...(required ? { campos_requeridos: required } : {}), path: request.path, timestamp: new Date().toISOString() });
  }
}
