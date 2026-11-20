import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';
import { trustProxySetting } from './common/trust-proxy';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const trustProxy = trustProxySetting(config.get<string>('TRUST_PROXY'));
  if (trustProxy !== undefined) app.set('trust proxy', trustProxy);
  configureApp(app, config.getOrThrow<string>('FRONTEND_ORIGIN'));
  const definition = new DocumentBuilder().setTitle('DistriRapido — US-001 / US-002 / US-003 / US-004 / US-005').setDescription('Autenticación, administración de cuentas, registro y consulta de pedidos.').setVersion('0.4.0').addBearerAuth().addCookieAuth('distrirapido_session_v2', { type: 'apiKey', in: 'cookie' }, 'session').build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, definition));
  app.enableShutdownHooks();
  await app.listen(config.getOrThrow<number>('PORT'), '0.0.0.0');
}
void bootstrap();
