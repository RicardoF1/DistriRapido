import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  const original = process.env.APP_VERSION;
  afterEach(() => { if (original === undefined) delete process.env.APP_VERSION; else process.env.APP_VERSION = original; });

  it('informa ok y la versión desplegada cuando PostgreSQL responde', async () => {
    process.env.APP_VERSION = 'abc1234';
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as PrismaService;
    await expect(new HealthController(prisma).check()).resolves.toEqual({ status: 'ok', database: 'up', version: 'abc1234' });
  });

  it('usa "local" si no hay versión y responde 503 si la base de datos no responde', async () => {
    delete process.env.APP_VERSION;
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('sin conexión')) } as unknown as PrismaService;
    const error = await new HealthController(prisma).check().catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toEqual({ status: 'error', database: 'down', version: 'local' });
  });
});
