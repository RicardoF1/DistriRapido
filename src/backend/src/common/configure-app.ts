import { INestApplication, ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { constants } from 'node:zlib';
import { HttpExceptionFilter } from './http-exception.filter';

// Green IT (área 8): respuestas de más de 1 KB comprimidas con Brotli (preferido) o Gzip según Accept-Encoding.
// Calidad Brotli 5 y nivel Gzip 6: buena reducción con bajo coste de CPU por petición.
export const COMPRESSION_OPTIONS: compression.CompressionOptions = {
  threshold: 1024,
  level: 6,
  brotli: { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } },
};

export function configureApp(app: INestApplication, origin: string) {
  app.use(helmet());
  app.use(compression(COMPRESSION_OPTIONS));
  app.enableCors({ origin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'PUT'], allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
}
