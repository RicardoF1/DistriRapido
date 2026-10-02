import { ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
describe('Errores centralizados', () => {
  it.each([
    [new Error('secret database connection'), 500, 'No se pudo completar la solicitud.'],
    [new BadRequestException(['invalid email']), 400, ['invalid email']],
    [new HttpException('explicit', 401), 401, 'explicit'],
    [new HttpException({ detail: 'private' }, 400), 400, 'No se pudo completar la solicitud.'],
  ])('responde sin filtrar errores internos', (error, status, message) => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => ({ path: '/auth/login' }) }) } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch(error, host);
    expect(response.status).toHaveBeenCalledWith(status); expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message, path: '/auth/login' }));
  });
});
