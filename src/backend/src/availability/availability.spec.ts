import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  const activeDriver = {
    conductor_id: 'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
    estado: 'ACTIVO',
  };

  const inactiveDriver = {
    conductor_id: 'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
    estado: 'INACTIVO',
  };

  function createService(options?: {
    driver?: typeof activeDriver | null;
    overlap?: { disponibilidad_id: string } | null;
    current?: Record<string, unknown> | null;
  }) {
    const driver =
      options && 'driver' in options
        ? options.driver
        : activeDriver;

    const overlap =
      options && 'overlap' in options
        ? options.overlap
        : null;

    const current =
      options && 'current' in options
        ? options.current
        : {
            disponibilidad_id:
              '7bd3470d-ee10-4876-83fa-62595b7da17f',
            conductor_id: activeDriver.conductor_id,
            inicio: new Date('2026-10-10T13:00:00.000Z'),
            fin: new Date('2026-10-10T22:00:00.000Z'),
            estado: 'DISPONIBLE',
          };

    const created = {
      disponibilidad_id:
        '7bd3470d-ee10-4876-83fa-62595b7da17f',
      conductor_id: activeDriver.conductor_id,
      inicio: new Date('2026-10-10T13:00:00.000Z'),
      fin: new Date('2026-10-10T22:00:00.000Z'),
      estado: 'DISPONIBLE',
      creado_en: new Date(),
      actualizado_en: new Date(),
      conductor: activeDriver,
    };

    const transactionClient = {
      conductor: {
        findUnique: jest.fn().mockResolvedValue(driver),
      },
      disponibilidadConductor: {
        findFirst: jest.fn().mockResolvedValue(overlap),
        findUnique: jest.fn().mockResolvedValue(current),
        create: jest.fn().mockResolvedValue(created),
        update: jest.fn().mockImplementation(
          async ({ data }: { data: Record<string, unknown> }) => ({
            ...created,
            ...current,
            ...data,
          }),
        ),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (
          operation:
            | ((tx: typeof transactionClient) => Promise<unknown>)
            | unknown[],
        ) => {
          if (typeof operation === 'function') {
            return operation(transactionClient);
          }

          return operation;
        },
      ),
      disponibilidadConductor: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    return {
      service: new AvailabilityService(prisma),
      prisma,
      tx: transactionClient,
    };
  }

  it('registra disponibilidad para un conductor activo', async () => {
    const { service, tx } = createService();

    const result = await service.create({
      conductor_id: activeDriver.conductor_id,
      inicio: '2026-10-10T08:00:00-05:00',
      fin: '2026-10-10T17:00:00-05:00',
      estado: 'DISPONIBLE',
    });

    expect(result).toEqual(
      expect.objectContaining({
        conductor_id: activeDriver.conductor_id,
        estado: 'DISPONIBLE',
      }),
    );

    expect(
      tx.disponibilidadConductor.create,
    ).toHaveBeenCalledTimes(1);
  });

  it('rechaza un periodo cuyo fin no es posterior al inicio', async () => {
    const { service } = createService();

    await expect(
      service.create({
        conductor_id: activeDriver.conductor_id,
        inicio: '2026-10-10T17:00:00-05:00',
        fin: '2026-10-10T08:00:00-05:00',
        estado: 'DISPONIBLE',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un conductor inexistente', async () => {
    const { service } = createService({ driver: null });

    await expect(
      service.create({
        conductor_id: activeDriver.conductor_id,
        inicio: '2026-10-10T08:00:00-05:00',
        fin: '2026-10-10T17:00:00-05:00',
        estado: 'DISPONIBLE',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza disponibilidad para un conductor inactivo', async () => {
    const { service } = createService({
      driver: inactiveDriver,
    });

    await expect(
      service.create({
        conductor_id: inactiveDriver.conductor_id,
        inicio: '2026-10-10T08:00:00-05:00',
        fin: '2026-10-10T17:00:00-05:00',
        estado: 'DISPONIBLE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza intervalos superpuestos', async () => {
    const { service } = createService({
      overlap: {
        disponibilidad_id:
          '7bd3470d-ee10-4876-83fa-62595b7da17f',
      },
    });

    await expect(
      service.create({
        conductor_id: activeDriver.conductor_id,
        inicio: '2026-10-10T12:00:00-05:00',
        fin: '2026-10-10T18:00:00-05:00',
        estado: 'DISPONIBLE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('modifica el estado de una disponibilidad existente', async () => {
    const { service } = createService();

    const result = await service.update(
      '7bd3470d-ee10-4876-83fa-62595b7da17f',
      {
        estado: 'NO_DISPONIBLE',
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        estado: 'NO_DISPONIBLE',
      }),
    );
  });

  it('rechaza una actualización sin campos', async () => {
    const { service } = createService();

    await expect(
      service.update(
        '7bd3470d-ee10-4876-83fa-62595b7da17f',
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza la modificación de un registro inexistente', async () => {
    const { service } = createService({
      current: null,
    });

    await expect(
      service.update(
        '7bd3470d-ee10-4876-83fa-62595b7da17f',
        {
          estado: 'NO_DISPONIBLE',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
