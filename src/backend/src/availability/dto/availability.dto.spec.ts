import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  AvailabilityQueryDto,
  CreateAvailabilityDto,
} from './availability.dto';

describe('Availability DTO', () => {
  it('acepta una disponibilidad válida', async () => {
    const dto = plainToInstance(
      CreateAvailabilityDto,
      {
        conductor_id:
          'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
        inicio: '2026-10-10T08:00:00-05:00',
        fin: '2026-10-10T17:00:00-05:00',
        estado: 'DISPONIBLE',
      },
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rechaza un identificador de conductor inválido', async () => {
    const dto = plainToInstance(
      CreateAvailabilityDto,
      {
        conductor_id: 'no-es-uuid',
        inicio: '2026-10-10T08:00:00-05:00',
        fin: '2026-10-10T17:00:00-05:00',
        estado: 'DISPONIBLE',
      },
    );

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza un estado no permitido', async () => {
    const dto = plainToInstance(
      CreateAvailabilityDto,
      {
        conductor_id:
          'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
        inicio: '2026-10-10T08:00:00-05:00',
        fin: '2026-10-10T17:00:00-05:00',
        estado: 'MANTENIMIENTO',
      },
    );

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('convierte page y pageSize a números', async () => {
    const dto = plainToInstance(
      AvailabilityQueryDto,
      {
        page: '2',
        pageSize: '10',
      },
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(10);
  });
});
