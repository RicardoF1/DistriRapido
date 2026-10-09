import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AvailabilityPage } from './AvailabilityPage';
import { availabilityApi } from '../services/availability-api';
import { ApiError } from '../services/api';

const acceptSession = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    acceptSession,
  }),
}));

vi.mock('../services/availability-api', () => ({
  availabilityApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock(
  '../features/availability/AvailabilityForm',
  () => ({
    AvailabilityForm: ({
      initial,
      onSave,
    }: {
      initial?: {
        disponibilidad_id: string;
      };
      onSave: (values: {
        conductor_id: string;
        inicio: string;
        fin: string;
        estado: 'DISPONIBLE';
      }) => Promise<unknown>;
    }) => (
      <div>
        <p>
          {initial
            ? 'Formulario de edición'
            : 'Formulario de registro'}
        </p>

        <button
          type="button"
          onClick={() =>
            void onSave({
              conductor_id:
                'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
              inicio:
                '2026-10-11T13:00:00.000Z',
              fin:
                '2026-10-11T22:00:00.000Z',
              estado: 'DISPONIBLE',
            })
          }
        >
          Guardar formulario simulado
        </button>
      </div>
    ),
  }),
);

const record = {
  disponibilidad_id:
    '7bd3470d-ee10-4876-83fa-62595b7da17f',
  conductor_id:
    'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
  inicio: '2026-10-10T13:00:00.000Z',
  fin: '2026-10-10T22:00:00.000Z',
  estado: 'DISPONIBLE' as const,
  creado_en: '2026-10-09T16:32:47.016Z',
  actualizado_en: '2026-10-09T16:33:53.123Z',
  conductor: {
    conductor_id:
      'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
    nombre_completo: 'Conductor de prueba',
    dni: '70000001',
    estado: 'ACTIVO' as const,
  },
};

const pageResponse = {
  items: [record],
  total: 1,
  page: 1,
  pageSize: 20,
};

function renderPage(path: string) {
  window.history.pushState({}, '', path);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/disponibilidad"
          element={<AvailabilityPage />}
        />

        <Route
          path="/disponibilidad/nuevo"
          element={<AvailabilityPage />}
        />

        <Route
          path="/disponibilidad/:id"
          element={<AvailabilityPage />}
        />

        <Route
          path="/disponibilidad/:id/editar"
          element={<AvailabilityPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AvailabilityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(
      availabilityApi.list,
    ).mockResolvedValue(pageResponse);

    vi.mocked(
      availabilityApi.get,
    ).mockResolvedValue(record);

    vi.mocked(
      availabilityApi.create,
    ).mockResolvedValue(record);

    vi.mocked(
      availabilityApi.update,
    ).mockResolvedValue(record);
  });

  it('muestra el listado de disponibilidades', async () => {
    renderPage('/disponibilidad');

    expect(
      await screen.findByRole('heading', {
        name: 'Disponibilidad operativa',
      }),
    ).toBeVisible();

    expect(
      await screen.findByText(
        'Conductor de prueba',
      ),
    ).toBeVisible();

    expect(
      screen.getByText('70000001'),
    ).toBeVisible();

    expect(
      screen.getAllByText('Disponible'),
    ).toHaveLength(2);

    expect(
      screen.getByText('1 registro encontrado'),
    ).toBeVisible();

    expect(
      availabilityApi.list,
    ).toHaveBeenCalled();
  });

  it('muestra una consulta sin resultados', async () => {
    vi.mocked(
      availabilityApi.list,
    ).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });

    renderPage('/disponibilidad');

    expect(
      await screen.findByText(
        'No hay disponibilidades para esta consulta.',
      ),
    ).toBeVisible();

    expect(
      screen.getByText('0 registros encontrados'),
    ).toBeVisible();
  });

  it('aplica y limpia filtros', async () => {
    renderPage('/disponibilidad');

    await screen.findByText('Conductor de prueba');

    fireEvent.change(
      screen.getByLabelText('Estado'),
      {
        target: {
          value: 'DISPONIBLE',
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        'Inicio del periodo',
      ),
      {
        target: {
          value: '2026-10-10T08:00',
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText('Fin del periodo'),
      {
        target: {
          value: '2026-10-10T17:00',
        },
      },
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Filtrar',
      }),
    );

    await waitFor(() =>
      expect(
        availabilityApi.list,
      ).toHaveBeenCalled(),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Limpiar',
      }),
    );

    expect(
      screen.getByLabelText('Estado'),
    ).toHaveValue('');

    expect(
      screen.getByLabelText(
        'Inicio del periodo',
      ),
    ).toHaveValue('');

    expect(
      screen.getByLabelText('Fin del periodo'),
    ).toHaveValue('');
  });

  it('muestra el detalle de una disponibilidad', async () => {
    renderPage(
      `/disponibilidad/${record.disponibilidad_id}`,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Consultar disponibilidad',
      }),
    ).toBeVisible();

    expect(
      await screen.findByText(
        'Conductor de prueba',
      ),
    ).toBeVisible();

    expect(
      screen.getByText('70000001'),
    ).toBeVisible();

    expect(
      screen.getByRole('link', {
        name: 'Editar disponibilidad',
      }),
    ).toHaveAttribute(
      'href',
      `/disponibilidad/${record.disponibilidad_id}/editar`,
    );

    expect(
      availabilityApi.get,
    ).toHaveBeenCalledWith(
      record.disponibilidad_id,
      expect.any(AbortSignal),
    );
  });

  it('registra una nueva disponibilidad', async () => {
    renderPage('/disponibilidad/nuevo');

    expect(
      await screen.findByRole('heading', {
        name: 'Registrar disponibilidad',
      }),
    ).toBeVisible();

    expect(
      screen.getByText(
        'Formulario de registro',
      ),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Guardar formulario simulado',
      }),
    );

    await waitFor(() =>
      expect(
        availabilityApi.create,
      ).toHaveBeenCalledTimes(1),
    );
  });

  it('carga y modifica una disponibilidad', async () => {
    renderPage(
      `/disponibilidad/${record.disponibilidad_id}/editar`,
    );

    expect(
      await screen.findByText(
        'Formulario de edición',
      ),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Guardar formulario simulado',
      }),
    );

    await waitFor(() =>
      expect(
        availabilityApi.update,
      ).toHaveBeenCalledWith(
        record.disponibilidad_id,
        expect.objectContaining({
          estado: 'DISPONIBLE',
        }),
      ),
    );
  });

  it('muestra error de carga y permite reintentar', async () => {
    vi.mocked(
      availabilityApi.list,
    )
      .mockRejectedValueOnce(
        new Error(
          'No se pudo cargar la disponibilidad.',
        ),
      )
      .mockResolvedValueOnce(pageResponse);

    renderPage('/disponibilidad');

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar la disponibilidad.',
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Reintentar',
      }),
    );

    expect(
      await screen.findByText(
        'Conductor de prueba',
      ),
    ).toBeVisible();

    expect(
      availabilityApi.list,
    ).toHaveBeenCalledTimes(2);
  });

  it('descarta la sesión ante una respuesta 401', async () => {
    vi.mocked(
      availabilityApi.list,
    ).mockRejectedValue(
      new ApiError(
        'Sesión expirada.',
        401,
      ),
    );

    renderPage('/disponibilidad');

    await waitFor(() =>
      expect(
        acceptSession,
      ).toHaveBeenCalledWith(null),
    );
  });
});



