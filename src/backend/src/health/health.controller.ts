import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Comprobación de disponibilidad para el despliegue (deploy-production.yml) y el monitoreo de uptime.
 * Público y sin datos sensibles: solo informa si la API responde y llega a PostgreSQL, y qué commit corre.
 */
@ApiTags('Salud')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'API y base de datos disponibles.' })
  @ApiServiceUnavailableResponse({ description: 'La base de datos no responde.' })
  async check() {
    const version = process.env.APP_VERSION?.trim() || 'local';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down', version });
    }
    return { status: 'ok', database: 'up', version };
  }
}
