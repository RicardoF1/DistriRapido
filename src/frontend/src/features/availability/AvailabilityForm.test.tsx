import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { driversApi } from '../../services/drivers-api';
import type { AvailabilityRecord } from '../../types/availability';
import { AvailabilityForm } from './AvailabilityForm';

vi.mock('../../services/drivers-api', () => ({
  driversApi: {
    list: vi.fn(),
  },
}));

const driver = {
  conductor_id: 'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3',
  nombre_completo: 'Conductor de prueba',
  dni: '70000001',
  licencia_categoria: 'A-IIb',
  anios_experiencia: 3,
  telefono: '999111222',
  usuario_id: null,
  estado: 'ACTIVO' as const,
};

const initial: AvailabilityRecord = {
  disponibilidad_id:
    '7bd3470d-ee10-4876-83fa-62595b7da17f',
  conductor_id: driver.conductor_id,
  inicio: '2026-10-10T13:00:00.000Z',
  fin: '2026-10-10T22:00:00.000Z',
  estado: 'DISPONIBLE',
  creado_en: '2026-10-09T16:32:47.016Z',
  actualizado_en: '2026-10-09T16:32:47.016Z',
  conductor: driver,
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(driversApi.list).mockResolvedValue({
    items: [driver],
    total: 1,
    page: 1,
    pageSize: 20,
  });
});

it('carga solamente los conductores activos', async () => {
  render(
    <AvailabilityForm
      onSave={vi.fn()}
    />,
  );

  expect(
    await screen.findByRole('option', {
      name: /Conductor de prueba/,
    }),
  ).toBeVisible();

  expect(driversApi.list).toHaveBeenCalledWith(
    1,
    '',
    'ACTIVO',
    expect.any(AbortSignal),
  );
});

it('registra una disponibilidad válida convirtiendo las fechas a ISO', async () => {
  const save = vi.fn().mockResolvedValue(undefined);

  render(
    <AvailabilityForm
      onSave={save}
    />,
  );

  await screen.findByRole('option', {
    name: /Conductor de prueba/,
  });

  fireEvent.change(
    screen.getByLabelText('Conductor'),
    {
      target: {
        value: driver.conductor_id,
      },
    },
  );

  fireEvent.change(
    screen.getByLabelText('Inicio de la jornada'),
    {
      target: {
        value: '2026-10-11T08:00',
      },
    },
  );

  fireEvent.change(
    screen.getByLabelText('Fin de la jornada'),
    {
      target: {
        value: '2026-10-11T17:00',
      },
    },
  );

  fireEvent.change(
    screen.getByLabelText('Estado operativo'),
    {
      target: {
        value: 'NO_DISPONIBLE',
      },
    },
  );

  fireEvent.click(
    screen.getByRole('button', {
      name: 'Guardar disponibilidad',
    }),
  );

  await waitFor(() =>
    expect(save).toHaveBeenCalledTimes(1),
  );

  expect(save).toHaveBeenCalledWith({
    conductor_id: driver.conductor_id,
    inicio: new Date(
      '2026-10-11T08:00',
    ).toISOString(),
    fin: new Date(
      '2026-10-11T17:00',
    ).toISOString(),
    estado: 'NO_DISPONIBLE',
  });
});

it('rechaza un periodo cuyo fin no es posterior al inicio', async () => {
  const save = vi.fn();

  render(
    <AvailabilityForm
      onSave={save}
    />,
  );

  await screen.findByRole('option', {
    name: /Conductor de prueba/,
  });

  fireEvent.change(
    screen.getByLabelText('Conductor'),
    {
      target: {
        value: driver.conductor_id,
      },
    },
  );

  fireEvent.change(
    screen.getByLabelText('Inicio de la jornada'),
    {
      target: {
        value: '2026-10-11T17:00',
      },
    },
  );

  fireEvent.change(
    screen.getByLabelText('Fin de la jornada'),
    {
      target: {
        value: '2026-10-11T08:00',
      },
    },
  );

  fireEvent.click(
    screen.getByRole('button', {
      name: 'Guardar disponibilidad',
    }),
  );

  expect(
    await screen.findByRole('alert'),
  ).toHaveTextContent(
    'La fecha y hora de fin debe ser posterior al inicio.',
  );

  expect(save).not.toHaveBeenCalled();
});

it('carga los datos de una disponibilidad existente para edición', async () => {
  render(
    <AvailabilityForm
      initial={initial}
      onSave={vi.fn()}
    />,
  );

  await screen.findByRole('option', {
    name: /Conductor de prueba/,
  });

  expect(
    screen.getByLabelText('Conductor'),
  ).toHaveValue(driver.conductor_id);

  expect(
    screen.getByLabelText('Estado operativo'),
  ).toHaveValue('DISPONIBLE');

  expect(
    screen.getByLabelText('Inicio de la jornada'),
  ).not.toHaveValue('');

  expect(
    screen.getByLabelText('Fin de la jornada'),
  ).not.toHaveValue('');
});

it('muestra el conflicto devuelto por la API y permite reintentar', async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(
      new Error(
        'El conductor ya tiene una disponibilidad que se superpone con el intervalo indicado.',
      ),
    )
    .mockResolvedValueOnce(undefined);

  render(
    <AvailabilityForm
      initial={initial}
      onSave={save}
    />,
  );

  await screen.findByRole('option', {
    name: /Conductor de prueba/,
  });

  fireEvent.click(
    screen.getByRole('button', {
      name: 'Guardar disponibilidad',
    }),
  );

  expect(
    await screen.findByRole('alert'),
  ).toHaveTextContent(
    'El conductor ya tiene una disponibilidad que se superpone',
  );

  expect(
    screen.getByRole('button', {
      name: 'Guardar disponibilidad',
    }),
  ).toBeEnabled();

  fireEvent.click(
    screen.getByRole('button', {
      name: 'Guardar disponibilidad',
    }),
  );

  await waitFor(() =>
    expect(save).toHaveBeenCalledTimes(2),
  );
});

it('muestra error si no puede cargar los conductores', async () => {
  vi.mocked(driversApi.list).mockRejectedValue(
    new Error(
      'No se pudieron consultar los conductores.',
    ),
  );

  render(
    <AvailabilityForm
      onSave={vi.fn()}
    />,
  );

  expect(
    await screen.findByRole('alert'),
  ).toHaveTextContent(
    'No se pudieron consultar los conductores.',
  );
});
