import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { RouteDetailPage } from './RouteDetailPage';
import { routeFixture } from '../test/route-fixture';
import { ApiError } from '../services/api';
import type { RouteDetail, RouteSustainability } from '../types/routes';

const mock = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), candidates: vi.fn(), assign: vi.fn(), confirm: vi.fn(), registerSustainability: vi.fn(), acceptSession: vi.fn() }));
vi.mock('../services/routes-api', () => ({ routesApi: mock }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ acceptSession: mock.acceptSession }) }));
vi.mock('../features/routes/RouteMap', () => ({ RouteMap: () => <div>Visor de geometría registrada</div> }));

const [baseVersion] = routeFixture.versiones;
/** Ruta confirmada de 12,5 km con un vehículo de 10 km/L y 0,21 kg CO₂/km. */
const confirmed: RouteDetail = { ...routeFixture, estado: 'CONFIRMADA', confirmado_en: '2030-01-01T12:10:00Z', version_confirmada: 1, confirmador: { email: 'planificador@example.test' }, versiones: [{ ...baseVersion, distancia_m: '12500', resultado: { ...baseVersion.resultado, confirmable: true } }] };
const registeredAt = '2030-01-01T18:00:00Z';
const record: RouteSustainability = { registro_id: 's1', ruta_id: 'r', ruta_version: 1, distancia_km: '12.5', combustible_l: '1.25', factor_emision_kg_co2_km: '0.21', emisiones_co2_kg: '2.625', origen_datos: 'ESTIMADO', costo_combustible: '18.9', observaciones: null, registrado_en: registeredAt, vehiculo: { vehiculo_id: 'v1', placa: 'SIN-123' }, registrador: { email: 'supervisor@example.test' } };

beforeEach(() => { vi.resetAllMocks(); mock.get.mockResolvedValue(confirmed); mock.candidates.mockResolvedValue([]); });
function open() { return render(<MemoryRouter initialEntries={['/rutas/r']}><Routes><Route path="/rutas/:id" element={<RouteDetailPage />} /></Routes></MemoryRouter>); }
const field = (name: RegExp) => screen.getByLabelText(name);
async function panel() { open(); return screen.findByRole('group', { name: 'Registrar sostenibilidad' }); }

it('escenario 1: registra la información precargada, la asocia a la ruta y muestra el registro', async () => {
  let finish!: (value: unknown) => void;
  mock.registerSustainability.mockReturnValue(new Promise(done => { finish = done; }));
  const group = await panel();
  expect(group.tagName).toBe('FIELDSET');
  expect(field(/^Distancia recorrida \(km\)/)).toHaveValue(12.5);
  expect(field(/^Combustible consumido \(L\)/)).toHaveValue(1.25);
  expect(field(/^Factor de emisión/)).toHaveValue(0.21);
  expect(field(/^Origen de los datos/)).toHaveValue('');
  expect(screen.getByText('2.625 kg CO₂').tagName).toBe('OUTPUT');
  await userEvent.selectOptions(field(/^Origen de los datos/), 'ESTIMADO');
  await userEvent.type(field(/^Costo de combustible/), '18.9');
  await userEvent.type(field(/^Observaciones/), '  Lectura del odómetro  ');
  const button = within(group).getByRole('button', { name: 'Registrar sostenibilidad' });
  await userEvent.dblClick(button);
  expect(mock.registerSustainability).toHaveBeenCalledTimes(1);
  expect(mock.registerSustainability).toHaveBeenCalledWith('r', { distancia_km: 12.5, combustible_l: 1.25, factor_emision_kg_co2_km: 0.21, origen_datos: 'ESTIMADO', costo_combustible: 18.9, observaciones: 'Lectura del odómetro' });
  expect(screen.getByRole('button', { name: 'Registrando…' })).toBeDisabled();
  mock.get.mockResolvedValue({ ...confirmed, sostenibilidad: { ...record, observaciones: 'Lectura del odómetro' } });
  finish(record);
  const notice = await screen.findByText(/^Información de sostenibilidad registrada el .+\.$/);
  expect(notice.tagName).toBe('OUTPUT');
  expect(await screen.findByText('supervisor@example.test')).toBeVisible();
  expect(screen.getByText('Emisiones de CO₂').nextElementSibling).toHaveTextContent('2.625 kg CO₂');
  expect(screen.getByText('Origen de los datos').nextElementSibling).toHaveTextContent('Estimado a partir del cálculo');
  expect(screen.getByText('Costo de combustible').nextElementSibling).toHaveTextContent('S/ 18.90');
  expect(screen.getByText('Observaciones').nextElementSibling).toHaveTextContent('Lectura del odómetro');
  expect(screen.getByText('Vehículo').nextElementSibling).toHaveTextContent('SIN-123');
  expect(screen.queryByRole('group', { name: 'Registrar sostenibilidad' })).not.toBeInTheDocument();
  expect(mock.get).toHaveBeenCalledTimes(2);
});

it('escenario 2: con información incompleta no envía nada y señala cada dato requerido', async () => {
  mock.get.mockResolvedValue({ ...confirmed, versiones: [{ ...confirmed.versiones[0], distancia_m: '0', vehiculo: { placa: 'SIN-123', consumo_km_l: '0', factor_emision_kg_co2_km: 'sin dato' } }] });
  const group = await panel();
  expect(within(group).getByText('Completa la distancia y el factor de emisión')).toBeVisible();
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('No se puede registrar. Falta información requerida: distancia recorrida (km), combustible consumido (l), factor de emisión (kg co₂/km), origen de los datos.');
  for (const name of [/^Distancia recorrida/, /^Combustible consumido/, /^Factor de emisión/, /^Origen de los datos/]) {
    expect(field(name)).toHaveAttribute('aria-invalid', 'true');
    expect(field(name)).toHaveAccessibleDescription('Dato obligatorio.');
  }
  expect(field(/^Costo de combustible/)).toHaveAttribute('aria-invalid', 'false');
  expect(mock.registerSustainability).not.toHaveBeenCalled();
  await userEvent.type(field(/^Distancia recorrida/), '3');
  expect(field(/^Distancia recorrida/)).toHaveAttribute('aria-invalid', 'false');
});

it('escenario 2: señala solo el origen cuando es lo único que falta', async () => {
  const group = await panel();
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Falta información requerida: origen de los datos.');
  expect(field(/^Distancia recorrida/)).toHaveAttribute('aria-invalid', 'false');
  expect(mock.registerSustainability).not.toHaveBeenCalled();
});

it('no envía datos medidos mientras la ruta no está completada e indica la condición', async () => {
  const group = await panel();
  expect(within(group).getByText('Mientras la ruta no esté completada solo se pueden registrar datos estimados.')).toBeVisible();
  await userEvent.selectOptions(field(/^Origen de los datos/), 'MEDIDO');
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se puede registrar. Revisa: origen de los datos.');
  expect(field(/^Origen de los datos/)).toHaveAttribute('aria-invalid', 'true');
  expect(field(/^Origen de los datos/)).toHaveAccessibleDescription('Los datos medidos solo se pueden registrar cuando la ruta está completada. Registra datos estimados o espera a que la ruta termine.');
  expect(mock.registerSustainability).not.toHaveBeenCalled();
});

it('registra datos medidos en una ruta completada', async () => {
  mock.get.mockResolvedValue({ ...confirmed, estado: 'COMPLETADA', conductor_id: 'd1', asignado_en: '2030-01-01T12:30:00Z', conductor: { conductor_id: 'd1', nombre_completo: 'Ana' } });
  mock.registerSustainability.mockResolvedValue({ ...record, origen_datos: 'MEDIDO' });
  const group = await panel();
  expect(within(group).queryByText('Mientras la ruta no esté completada solo se pueden registrar datos estimados.')).not.toBeInTheDocument();
  await userEvent.selectOptions(field(/^Origen de los datos/), 'MEDIDO');
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  await waitFor(() => expect(mock.registerSustainability).toHaveBeenCalledWith('r', { distancia_km: 12.5, combustible_l: 1.25, factor_emision_kg_co2_km: 0.21, origen_datos: 'MEDIDO' }));
});

it('marca los valores fuera de rango con su motivo', async () => {
  const group = await panel();
  await userEvent.clear(field(/^Distancia recorrida/));
  await userEvent.type(field(/^Distancia recorrida/), '1.23456');
  await userEvent.type(field(/^Costo de combustible/), '-2');
  await userEvent.selectOptions(field(/^Origen de los datos/), 'ESTIMADO');
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se puede registrar. Revisa: distancia recorrida (km), costo de combustible (s/).');
  expect(field(/^Distancia recorrida/)).toHaveAccessibleDescription('Indica un número mayor que 0 y hasta 10 000, con hasta 3 decimales.');
  expect(field(/^Costo de combustible/)).toHaveAccessibleDescription('Indica un número entre 0 y 1 000 000, con hasta 2 decimales.');
  expect(mock.registerSustainability).not.toHaveBeenCalled();
});

it('muestra el rechazo del backend con la información requerida', async () => {
  const message = 'No se registró la información de sostenibilidad. Falta: factor de emisión (kg CO₂/km).';
  mock.registerSustainability.mockRejectedValue(new ApiError(message, 400, undefined, 'INFORMACION_INSUFICIENTE'));
  const group = await panel();
  await userEvent.selectOptions(field(/^Origen de los datos/), 'ESTIMADO');
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(message);
  expect(within(alert).queryByRole('button', { name: 'Recargar ruta' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Registrar sostenibilidad' })).toBeEnabled();
});

it('ante un 409 (ya registrada o ruta cambiada) ofrece recargar', async () => {
  mock.registerSustainability.mockRejectedValue(new ApiError('La ruta ya tiene información de sostenibilidad registrada.', 409));
  const group = await panel();
  await userEvent.selectOptions(field(/^Origen de los datos/), 'ESTIMADO');
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  const alert = await screen.findByRole('alert');
  await userEvent.click(within(alert).getByRole('button', { name: 'Recargar ruta' }));
  await waitFor(() => expect(mock.get).toHaveBeenCalledTimes(2));
});

it('usa un mensaje genérico si el fallo no trae texto y cierra la sesión expirada', async () => {
  mock.registerSustainability.mockRejectedValueOnce(new Error(''));
  const group = await panel();
  await userEvent.selectOptions(field(/^Origen de los datos/), 'ESTIMADO');
  await userEvent.click(within(group).getByRole('button', { name: 'Registrar sostenibilidad' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar la información de sostenibilidad.');
  mock.registerSustainability.mockRejectedValueOnce(new ApiError('Sesión expirada', 401));
  await userEvent.click(screen.getByRole('button', { name: 'Registrar sostenibilidad' }));
  await waitFor(() => expect(mock.acceptSession).toHaveBeenCalledWith(null));
});

it.each([
  ['una ruta generada', routeFixture, 'Confirma la ruta antes de registrar su información de sostenibilidad.'],
  ['una versión histórica', { ...confirmed, current_version: 2 }, 'Estás consultando una versión histórica. Consulta la versión actual para registrar su información de sostenibilidad.'],
])('no ofrece registrar en %s', async (_, detail, reason) => {
  mock.get.mockResolvedValue(detail);
  open();
  expect(await screen.findByText(reason)).toBeVisible();
  expect(screen.queryByRole('group', { name: 'Registrar sostenibilidad' })).not.toBeInTheDocument();
});

it('muestra un registro existente sin costo ni observaciones ni usuario disponible', async () => {
  mock.get.mockResolvedValue({ ...confirmed, sostenibilidad: { ...record, costo_combustible: null, registrador: null } });
  open();
  expect(await screen.findByRole('heading', { name: 'Sostenibilidad' })).toBeVisible();
  expect(screen.getByText('Costo de combustible').nextElementSibling).toHaveTextContent('No informado');
  expect(screen.getByText('Observaciones').nextElementSibling).toHaveTextContent('Sin observaciones');
  expect(screen.getByText('Registrado por').nextElementSibling).toHaveTextContent('No disponible');
  expect(screen.getByText('Origen de los datos').nextElementSibling).toHaveTextContent('Estimado a partir del cálculo');
  expect(screen.queryByRole('group', { name: 'Registrar sostenibilidad' })).not.toBeInTheDocument();
});
