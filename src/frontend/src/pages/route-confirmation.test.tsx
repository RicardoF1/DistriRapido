import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { RouteDetailPage } from './RouteDetailPage';
import { routeFixture } from '../test/route-fixture';
import { ApiError } from '../services/api';
import type { RouteDetail } from '../types/routes';

const mock = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), candidates: vi.fn(), assign: vi.fn(), confirm: vi.fn(), acceptSession: vi.fn() }));
vi.mock('../services/routes-api', () => ({ routesApi: mock }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ acceptSession: mock.acceptSession }) }));
vi.mock('../features/routes/RouteMap', () => ({ RouteMap: () => <div>Visor de geometría registrada</div> }));

const [baseVersion] = routeFixture.versiones;
const reviewed: RouteDetail = { ...routeFixture, versiones: [{ ...baseVersion, resultado: { ...baseVersion.resultado, confirmable: true } }] };
const confirmedAt = '2030-01-01T12:10:00Z';
const confirmed: RouteDetail = { ...reviewed, estado: 'CONFIRMADA', confirmado_en: confirmedAt, version_confirmada: 1, confirmador: { email: 'planificador@example.test' } };
const review = 'Revisé el recorrido, las paradas y las advertencias, y confirmo esta ruta para su ejecución.';

beforeEach(() => { vi.resetAllMocks(); mock.get.mockResolvedValue(reviewed); mock.candidates.mockResolvedValue([]); });
function open() { return render(<MemoryRouter initialEntries={['/rutas/r']}><Routes><Route path="/rutas/:id" element={<RouteDetailPage />} /></Routes></MemoryRouter>); }
async function confirmButton() {
  open();
  await userEvent.click(await screen.findByRole('checkbox', { name: review }));
  return screen.getByRole('button', { name: 'Confirmar ruta' });
}

it('escenario 1: confirma una ruta generada y revisada y habilita la asignación', async () => {
  let finish!: (value: unknown) => void;
  mock.confirm.mockReturnValue(new Promise(done => { finish = done; }));
  open();
  const group = await screen.findByRole('group', { name: 'Confirmar ruta' });
  expect(group.tagName).toBe('FIELDSET');
  expect(screen.getByText('Generada')).toBeVisible();
  expect(screen.getAllByText('Sin confirmar')).toHaveLength(3);
  expect(screen.getByText('Confirma la ruta antes de asignarle un conductor.')).toBeVisible();
  expect(screen.queryByRole('group', { name: 'Asignar conductor' })).not.toBeInTheDocument();
  const button = within(group).getByRole('button', { name: 'Confirmar ruta' });
  expect(button).toBeDisabled();
  await userEvent.click(within(group).getByRole('checkbox', { name: review }));
  await userEvent.dblClick(button);
  expect(mock.confirm).toHaveBeenCalledTimes(1);
  expect(mock.confirm).toHaveBeenCalledWith('r');
  expect(screen.getByRole('button', { name: 'Confirmando…' })).toBeDisabled();
  mock.get.mockResolvedValue(confirmed);
  finish({ ruta_id: 'r', estado: 'CONFIRMADA', current_version: 1, confirmado_en: confirmedAt, version_confirmada: 1, confirmador: { email: 'planificador@example.test' } });
  const notice = await screen.findByText(/^Ruta confirmada el .+; ya puedes asignar un conductor\.$/);
  expect(notice.tagName).toBe('OUTPUT');
  expect(await screen.findByText('Confirmada')).toBeVisible();
  expect(screen.getByText('planificador@example.test')).toBeVisible();
  expect(screen.getByText('Confirmada el').nextElementSibling).toHaveTextContent(new Date(confirmedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' }));
  expect(screen.queryByRole('group', { name: 'Confirmar ruta' })).not.toBeInTheDocument();
  expect(await screen.findByRole('group', { name: 'Asignar conductor' })).toBeVisible();
  expect(mock.get).toHaveBeenCalledTimes(2);
});

it.each([
  ['versión no confirmable', routeFixture, 'La versión actual no es confirmable: revisa las restricciones del cálculo.'],
  ['pedido cambiado', { ...reviewed, current_warnings: ['PEDIDO_DESACTUALIZADO:o1'] }, 'Un pedido cambió desde el cálculo (estado, cliente, dirección, carga o ventana horaria).'],
  ['varios pedidos cambiados', { ...reviewed, current_warnings: ['PEDIDO_DESACTUALIZADO:o1', 'PEDIDO_DESACTUALIZADO:o2'] }, '2 pedidos cambiaron desde el cálculo (estado, cliente, dirección, carga o ventana horaria).'],
  ['fuentes desactualizadas', { ...reviewed, current_warnings: ['FUENTES_DESACTUALIZADAS'] }, 'Los datos usados en el cálculo cambiaron; genera una nueva planificación.'],
  ['recursos no disponibles', { ...reviewed, current_warnings: ['RECURSOS_O_PEDIDOS_NO_DISPONIBLES'] }, 'El vehículo, los conductores o los pedidos del cálculo ya no están disponibles.'],
  ['sin jornada calculada', { ...reviewed, versiones: [{ ...reviewed.versiones[0], resultado: { ...reviewed.versiones[0].resultado, end: '' } }] }, 'La versión actual no tiene la jornada calculada.'],
])('escenario 2: con %s indica la condición pendiente e impide confirmar', async (_, detail, condition) => {
  mock.get.mockResolvedValue(detail);
  open();
  const group = await screen.findByRole('group', { name: 'Confirmar ruta' });
  const pending = within(group).getByRole('status');
  expect(pending).toHaveTextContent('Antes de confirmar resuelve estas condiciones:');
  expect(within(pending).getByText(condition)).toBeVisible();
  expect(within(group).getByRole('checkbox', { name: review })).toBeDisabled();
  expect(within(group).getByRole('button', { name: 'Confirmar ruta' })).toBeDisabled();
  expect(mock.confirm).not.toHaveBeenCalled();
});

it.each([
  ['versión histórica', { ...reviewed, current_version: 2 }],
  ['ruta CONFIRMADA', confirmed],
  ['ruta ASIGNADA', { ...confirmed, estado: 'ASIGNADA' as const, conductor_id: 'd1', asignado_en: '2030-01-01T12:30:00Z', conductor: { conductor_id: 'd1', nombre_completo: 'Ana' } }],
])('no ofrece confirmar una %s', async (_, detail) => {
  mock.get.mockResolvedValue(detail);
  open();
  expect(await screen.findByRole('heading', { name: 'Confirmación' })).toBeVisible();
  expect(screen.queryByRole('group', { name: 'Confirmar ruta' })).not.toBeInTheDocument();
});

it('muestra con role="alert" las condiciones que detecta el backend y permite recargar', async () => {
  const message = 'No se puede confirmar la ruta. Condiciones pendientes: El vehículo ya está asignado a otra ruta activa.';
  mock.confirm.mockRejectedValue(new ApiError(message, 409));
  await userEvent.click(await confirmButton());
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(message);
  expect(screen.getByRole('button', { name: 'Confirmar ruta' })).toBeEnabled();
  await userEvent.click(within(alert).getByRole('button', { name: 'Recargar ruta' }));
  await waitFor(() => expect(mock.get).toHaveBeenCalledTimes(2));
});

it.each([400, 403, 404])('muestra el error %s sin botón de recarga', async status => {
  mock.confirm.mockRejectedValue(new ApiError('Motivo del backend', status));
  await userEvent.click(await confirmButton());
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Motivo del backend');
  expect(within(alert).queryByRole('button', { name: 'Recargar ruta' })).not.toBeInTheDocument();
});

it('usa un mensaje genérico si el fallo no trae texto y cierra la sesión expirada', async () => {
  mock.confirm.mockRejectedValueOnce(new Error(''));
  await userEvent.click(await confirmButton());
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo confirmar la ruta.');
  mock.confirm.mockRejectedValueOnce(new ApiError('Sesión expirada', 401));
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar ruta' }));
  await waitFor(() => expect(mock.acceptSession).toHaveBeenCalledWith(null));
});
