import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './http-exception.filter';

export function configureApp(app: INestApplication, origin: string) {
  app.use(helmet());
  app.enableCors({ origin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'PUT'], allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
}
