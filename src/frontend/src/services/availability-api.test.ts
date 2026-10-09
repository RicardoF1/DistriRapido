import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { request } from './api';
import { availabilityApi } from './availability-api';

vi.mock('./api', () => ({
  request: vi.fn(),
}));

describe('availabilityApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta disponibilidades con paginación y filtros', async () => {
    vi.mocked(request).mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 20,
    });

    await availabilityApi.list(
      2,
      'DISPONIBLE',
      '2026-10-10T13:00:00.000Z',
      '2026-10-10T22:00:00.000Z',
    );

    expect(request).toHaveBeenCalledTimes(1);

    const [url, options] =
      vi.mocked(request).mock.calls[0];

    expect(url).toContain('/availability?');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=20');
    expect(url).toContain('estado=DISPONIBLE');
    expect(url).toContain(
      'inicio=2026-10-10T13%3A00%3A00.000Z',
    );
    expect(url).toContain(
      'fin=2026-10-10T22%3A00%3A00.000Z',
    );
    expect(options).toEqual({
      signal: undefined,
    });
  });

  it('consulta una disponibilidad por identificador', async () => {
    vi.mocked(request).mockResolvedValue({});

    await availabilityApi.get(
      '7bd3470d-ee10-4876-83fa-62595b7da17f',
    );

    expect(request).toHaveBeenCalledWith(
      '/availability/7bd3470d-ee10-4876-83fa-62595b7da17f',
      {
        signal: undefined,
      },
    );
  });

  it('registra disponibilidad mediante POST', async () => {
    vi.mocked(request).mockResolvedValue({});

    const values = {
      conductor_id:
        'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
      inicio: '2026-10-11T13:00:00.000Z',
      fin: '2026-10-11T22:00:00.000Z',
      estado: 'DISPONIBLE' as const,
    };

    await availabilityApi.create(values);

    expect(request).toHaveBeenCalledWith(
      '/availability',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      },
    );
  });

  it('modifica disponibilidad mediante PATCH', async () => {
    vi.mocked(request).mockResolvedValue({});

    await availabilityApi.update(
      '7bd3470d-ee10-4876-83fa-62595b7da17f',
      {
        estado: 'NO_DISPONIBLE',
      },
    );

    expect(request).toHaveBeenCalledWith(
      '/availability/7bd3470d-ee10-4876-83fa-62595b7da17f',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'NO_DISPONIBLE',
        }),
      },
    );
  });
});
