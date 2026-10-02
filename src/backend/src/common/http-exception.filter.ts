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
    response.status(statusCode).json({ statusCode, message, path: request.path, timestamp: new Date().toISOString() });
  }
}
