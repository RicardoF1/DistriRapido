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

  const send = (error: unknown, path: string) => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => ({ path }) }) } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch(error, host);
    return response.json.mock.calls[0][0] as Record<string, unknown>;
  };
  const missing = (campos_requeridos: unknown, code = 'INFORMACION_INSUFICIENTE') => new BadRequestException({ message: 'Falta información.', code, campos_requeridos });

  it('US-021: en rutas expone el código y los nombres de la información requerida', () => {
    expect(send(missing(['distancia_km', 'origen_datos']), '/routes/r/sustainability')).toMatchObject({ statusCode: 400, message: 'Falta información.', code: 'INFORMACION_INSUFICIENTE', campos_requeridos: ['distancia_km', 'origen_datos'] });
  });

  it.each([
    ['fuera de rutas', missing(['distancia_km']), '/auth/login'],
    ['con texto libre', missing(['<script>']), '/routes/r/sustainability'],
    ['con demasiados campos', missing(Array.from({ length: 11 }, (_, i) => `campo_${i}`)), '/routes/r/sustainability'],
    ['si no es una lista', missing('distancia_km'), '/routes/r/sustainability'],
  ])('no expone campos_requeridos %s', (_, error, path) => {
    expect(send(error, path)).not.toHaveProperty('campos_requeridos');
  });

  it('no expone códigos desconocidos', () => {
    expect(send(missing(['distancia_km'], 'OTRO_CODIGO'), '/routes/r/sustainability')).not.toHaveProperty('code');
  });
});
