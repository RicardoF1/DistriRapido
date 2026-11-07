import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { RouteDetailPage } from './RouteDetailPage';
import { routeFixture } from '../test/route-fixture';
import { ApiError } from '../services/api';
import type { RouteDetail } from '../types/routes';

const mock = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), candidates: vi.fn(), assign: vi.fn(), acceptSession: vi.fn() }));
vi.mock('../services/routes-api', () => ({ routesApi: mock }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ acceptSession: mock.acceptSession }) }));
vi.mock('../features/routes/RouteMap', () => ({ RouteMap: () => <div>Visor de geometría registrada</div> }));

const [baseVersion] = routeFixture.versiones;
const assignable: RouteDetail = { ...routeFixture, versiones: [{ ...baseVersion, resultado: { ...baseVersion.resultado, confirmable: true } }] };
const assignedAt = '2030-01-01T12:30:00Z';
const assigned: RouteDetail = { ...assignable, estado: 'ASIGNADA', conductor_id: 'd1', asignado_en: assignedAt, conductor: { conductor_id: 'd1', nombre_completo: 'Ana Elegible' } };
const candidates = [{ conductor_id: 'd1', nombre_completo: 'Ana Elegible' }, { conductor_id: 'd2', nombre_completo: 'Beto Disponible' }];
const confirmation = 'Confirmo asignar esta ruta al conductor seleccionado.';

beforeEach(() => { vi.resetAllMocks(); mock.get.mockResolvedValue(assignable); mock.candidates.mockResolvedValue(candidates); });
function open() { return render(<MemoryRouter initialEntries={['/rutas/r']}><Routes><Route path="/rutas/:id" element={<RouteDetailPage />} /></Routes></MemoryRouter>); }
async function ready() {
  open();
  const select = await screen.findByLabelText('Conductor');
  await waitFor(() => expect(select).toBeEnabled());
  return select;
}
async function fill() {
  await userEvent.selectOptions(await ready(), 'd1');
  await userEvent.click(screen.getByRole('checkbox', { name: confirmation }));
  return screen.getByRole('button', { name: 'Asignar ruta' });
}

it('muestra el panel accesible en ruta GENERADA, sin conductor, confirmable y versión actual', async () => {
  await ready();
  const group = screen.getByRole('group', { name: 'Asignar conductor' });
  expect(group.tagName).toBe('FIELDSET');
  expect(within(group).getByLabelText('Conductor').tagName).toBe('SELECT');
  expect(within(group).getByRole('checkbox', { name: confirmation })).not.toBeChecked();
  expect(screen.getByText('GENERADA')).toBeVisible();
  expect(screen.getAllByText('Sin asignar')).toHaveLength(2);
  expect(mock.candidates).toHaveBeenCalledWith('r', expect.any(AbortSignal));
});

it.each([
  ['versión histórica', { ...assignable, current_version: 2 }, 'Estás consultando una versión histórica. Solo la versión actual puede asignarse.'],
  ['ruta no confirmable', routeFixture, 'La ruta no es confirmable. Revisa las restricciones antes de asignarla.'],
  ['ruta ASIGNADA', assigned, 'La ruta ya fue asignada. Esta interfaz no permite reasignar.'],
  ['ruta EN_CURSO', { ...assigned, estado: 'EN_CURSO' }, 'La ruta está en curso y no admite asignación.'],
  ['ruta COMPLETADA', { ...assigned, estado: 'COMPLETADA' }, 'La ruta está completada y no admite asignación.'],
])('oculta el panel con %s y explica el motivo', async (_, detail, reason) => {
  mock.get.mockResolvedValue(detail);
  open();
  expect(await screen.findByText(reason)).toBeVisible();
  expect(screen.queryByRole('group', { name: 'Asignar conductor' })).not.toBeInTheDocument();
  expect(mock.candidates).not.toHaveBeenCalled();
});

it('lista solo los candidatos elegibles devueltos por el backend', async () => {
  const select = await ready();
  expect(within(select).getAllByRole('option').map(option => option.textContent)).toEqual(['Selecciona un conductor', 'Ana Elegible', 'Beto Disponible']);
});

it('informa lista vacía sin permitir el envío', async () => {
  mock.candidates.mockResolvedValue([]);
  open();
  expect(await screen.findByText('No hay conductores elegibles para esta ruta.')).toBeVisible();
  expect(screen.getByLabelText('Conductor')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Asignar ruta' })).toBeDisabled();
});

it('mantiene el botón deshabilitado durante la carga, sin selección y sin confirmación', async () => {
  let resolve!: (value: typeof candidates) => void;
  mock.candidates.mockReturnValue(new Promise(done => { resolve = done; }));
  open();
  expect(await screen.findByText('Cargando conductores elegibles…')).toHaveAttribute('role', 'status');
  const button = screen.getByRole('button', { name: 'Asignar ruta' });
  expect(button).toBeDisabled();
  resolve(candidates);
  const select = screen.getByLabelText('Conductor');
  await waitFor(() => expect(select).toBeEnabled());
  await userEvent.selectOptions(select, 'd1');
  expect(button).toBeDisabled();
  const checkbox = screen.getByRole('checkbox', { name: confirmation });
  await userEvent.click(checkbox);
  expect(button).toBeEnabled();
  await userEvent.click(checkbox);
  expect(button).toBeDisabled();
  expect(mock.assign).not.toHaveBeenCalled();
});

it('bloquea el doble envío, recarga el detalle y muestra la asignación sin redirigir', async () => {
  let finish!: (value: unknown) => void;
  mock.assign.mockReturnValue(new Promise(done => { finish = done; }));
  const button = await fill();
  await userEvent.dblClick(button);
  expect(mock.assign).toHaveBeenCalledTimes(1);
  expect(mock.assign).toHaveBeenCalledWith('r', 'd1');
  expect(screen.getByRole('button', { name: 'Asignando…' })).toBeDisabled();
  mock.get.mockResolvedValue(assigned);
  finish({ ruta_id: 'r', estado: 'ASIGNADA', asignado_en: assignedAt, current_version: 1, conductor: { conductor_id: 'd1', nombre_completo: 'Ana Elegible' } });
  expect(await screen.findByText(/^Ruta asignada a Ana Elegible el /)).toHaveAttribute('role', 'status');
  expect(await screen.findByText('ASIGNADA')).toBeVisible();
  expect(screen.getByText('Ana Elegible')).toBeVisible();
  expect(screen.getByText(new Date(assignedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' }))).toBeVisible();
  expect(mock.get).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('group', { name: 'Asignar conductor' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Detalle de recorrido' })).toBeVisible();
});

it.each([
  [400, 'Revisa la selección, origen, jornada y confirmaciones.', false],
  [403, 'Origen no permitido.', false],
  [404, 'Conductor no encontrado.', false],
  [409, 'El vehículo ya está asignado a otra ruta activa.', true],
])('muestra el error %s del backend con role="alert"', async (status, message, reload) => {
  mock.assign.mockRejectedValue(new ApiError(message, status));
  await userEvent.click(await fill());
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(message);
  expect(screen.getByRole('button', { name: 'Asignar ruta' })).toBeEnabled();
  expect(within(alert).queryByRole('button', { name: 'Recargar ruta' }) !== null).toBe(reload);
  expect(mock.acceptSession).not.toHaveBeenCalled();
});

it('recarga el detalle desde el conflicto 409', async () => {
  mock.assign.mockRejectedValue(new ApiError('La ruta ya fue asignada o cambió de estado. Recarga antes de reintentar.', 409));
  await userEvent.click(await fill());
  await userEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Recargar ruta' }));
  await waitFor(() => expect(mock.get).toHaveBeenCalledTimes(2));
});

it('cierra la sesión expirada al cargar candidatos o al asignar', async () => {
  mock.assign.mockRejectedValue(new ApiError('Sesión expirada', 401));
  await userEvent.click(await fill());
  await waitFor(() => expect(mock.acceptSession).toHaveBeenCalledWith(null));
  mock.candidates.mockRejectedValue(new ApiError('Sesión expirada', 401));
  mock.acceptSession.mockClear();
  open();
  await waitFor(() => expect(mock.acceptSession).toHaveBeenCalledWith(null));
});

it('muestra con role="alert" el fallo al consultar candidatos', async () => {
  mock.candidates.mockRejectedValue(new ApiError('La ruta ya fue asignada o cambió de estado. Recarga antes de reintentar.', 409));
  open();
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('La ruta ya fue asignada o cambió de estado');
  expect(within(alert).getByRole('button', { name: 'Recargar ruta' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Asignar ruta' })).toBeDisabled();
});
