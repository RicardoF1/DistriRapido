import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../routes/AppRoutes';
import { AuthContext } from '../features/auth/auth-context';
import { ApiError } from '../services/api';
import { loginResponse } from '../test/fixtures';
import { historyApi, historyQuery, type HistoryDetail, type HistoryItem, type HistoryPage } from '../services/history-api';
import { formatDateTime } from '../features/operations/format';

vi.mock('../services/history-api', async () => ({
  ...await vi.importActual<typeof import('../services/history-api')>('../services/history-api'),
  historyApi: { list: vi.fn(), detail: vi.fn() },
}));
vi.mock('../services/driver-profile-api', async () => ({
  ...await vi.importActual<typeof import('../services/driver-profile-api')>('../services/driver-profile-api'),
  driverProfileApi: { me: vi.fn().mockResolvedValue({ conductor_id: 'd', nombre_completo: 'Conductor', estado: 'ACTIVO' }), routes: vi.fn().mockResolvedValue([]), route: vi.fn(), updateDelivery: vi.fn(), createIncident: vi.fn() },
}));

const item: HistoryItem = {
  ruta_id: 'r1', iniciado_en: '2032-08-21T02:00:00Z', finalizado_en: '2032-08-21T04:30:00Z',
  planificacion: { planificacion_id: 'p1', etiqueta: 'Plan norte' }, conductor: { conductor_id: 'd1', nombre_completo: 'Ana Histórica' },
  vehiculo: { vehiculo_id: 'v1', placa: 'ABC-123' }, entregas: { total: 2, realizadas: 1, no_realizadas: 1 }, incidencias: 1, con_sostenibilidad: true,
};
const page = (items: HistoryItem[], total = items.length, pageSize = 12): HistoryPage => ({ items, total, page: 1, pageSize });
const detail: HistoryDetail = {
  ruta_id: 'r1', estado: 'COMPLETADA', creado_en: '2032-08-20T12:00:00Z', confirmado_en: '2032-08-20T15:00:00Z', confirmado_por: 'planificador@example.test', version_confirmada: 1,
  asignado_en: '2032-08-20T16:00:00Z', iniciado_en: item.iniciado_en, finalizado_en: item.finalizado_en, current_version: 1,
  planificacion: { planificacion_id: 'p1', etiqueta: 'Plan norte', version: 2 }, conductor: item.conductor,
  version: { numero: 1, distancia_m: '8500', duracion_s: '900', vehiculo: { vehiculo_id: 'v1', placa: 'ABC-123', tipo: 'VAN' } },
  entregas: item.entregas, incidencias: 1,
  sostenibilidad: { ruta_version: 1, distancia_km: '8.5', combustible_l: '0.85', factor_emision_kg_co2_km: '0.2', emisiones_co2_kg: '1.7', origen_datos: 'MEDIDO', costo_combustible: '12.5', observaciones: 'Tráfico ligero', registrado_en: '2032-08-21T05:00:00Z', registrador: { email: 'operador@example.test' } },
  paradas: [
    { parada_id: 'p1', pedido_id: 'o1', secuencia: 1, direccion: 'Jr. Real 100', estado_entrega: 'ENTREGADA', causa_no_entrega: null, atendido_en: '2032-08-21T03:00:00Z', incidencias: [] },
    { parada_id: 'p2', pedido_id: 'o2', secuencia: 2, direccion: null, estado_entrega: 'NO_ENTREGADA', causa_no_entrega: 'Cliente ausente', atendido_en: '2032-08-21T04:00:00Z', incidencias: [{ incidencia_id: 'i1', tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende', detalle_complementario: 'Se tocó dos veces', registrado_en: '2032-08-21T04:00:00Z' }] },
  ],
};

let currentSearch = '';
function LocationProbe() { currentSearch = useLocation().search; return null; }
function renderPage(path = '/historial', role = 'Administrador') {
  const acceptSession = vi.fn();
  const session = { expiresAt: Date.now() + 900000, user: { ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role } } };
  render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ session, acceptSession, restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><AppRoutes /><LocationProbe /></AuthContext.Provider></MemoryRouter>);
  return { acceptSession };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(historyApi.list).mockResolvedValue(page([item]));
  vi.mocked(historyApi.detail).mockResolvedValue(detail);
});

describe('US-023 / RF-021: historial de operaciones', () => {
  it('escenario 1: lista las operaciones terminadas con su resumen', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Historial de operaciones', level: 1 })).toBeVisible();
    const table = await screen.findByRole('region', { name: 'Tabla del historial de operaciones' });
    const row = within(table).getByRole('row', { name: /Ana Histórica/ });
    for (const text of [formatDateTime(item.finalizado_en), 'Plan norte', 'ABC-123', '1/2', 'Registrada']) expect(row).toHaveTextContent(text);
    expect(screen.getByText('1 operación encontrada.')).toHaveAttribute('role', 'status');
    expect(historyApi.list).toHaveBeenCalledWith({}, 1, expect.any(AbortSignal));
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('aria-current', 'page');
  });

  it('muestra los valores por defecto de una operación sin conductor, vehículo ni sostenibilidad', async () => {
    vi.mocked(historyApi.list).mockResolvedValue(page([{ ...item, conductor: null, vehiculo: null, con_sostenibilidad: false }, { ...item, ruta_id: 'r2' }], 2));
    renderPage();
    const table = await screen.findByRole('region', { name: 'Tabla del historial de operaciones' });
    expect(within(table).getByRole('row', { name: /Sin conductor/ })).toHaveTextContent('No disponible');
    expect(within(table).getByText('Sin registro')).toBeVisible();
    expect(screen.getByText('2 operaciones encontradas.')).toBeVisible();
  });

  it('aplica los filtros, los guarda en la URL y vuelve a la primera página', async () => {
    renderPage('/historial?page=2');
    await screen.findByRole('region', { name: 'Tabla del historial de operaciones' });
    await userEvent.type(screen.getByLabelText('Finalizada desde'), '2032-08-01');
    await userEvent.type(screen.getByLabelText('Finalizada hasta'), '2032-08-31');
    await userEvent.type(screen.getByLabelText('Placa o conductor'), ' ABC ');
    await userEvent.click(screen.getByLabelText('Solo con incidencias'));
    await userEvent.click(screen.getByLabelText('Solo con entregas no realizadas'));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    const expected = { desde: '2032-08-01', hasta: '2032-08-31', search: 'ABC', con_incidencias: true, con_no_entregas: true };
    await waitFor(() => expect(historyApi.list).toHaveBeenLastCalledWith(expected, 1, expect.any(AbortSignal)));
    expect(currentSearch).toBe('?desde=2032-08-01&hasta=2032-08-31&search=ABC&con_incidencias=true&con_no_entregas=true');
    await userEvent.click(screen.getByLabelText('Solo con incidencias'));
    expect(screen.getByLabelText('Solo con incidencias')).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => expect(currentSearch).toBe(''));
    expect(screen.getByLabelText('Placa o conductor')).toHaveValue('');
  });

  it('lee los filtros de la URL e ignora los no permitidos', async () => {
    renderPage('/historial?desde=2032-08-01&hasta=agosto&estado=EN_CURSO&con_incidencias=si&search=%20Ana%20');
    await screen.findByRole('region', { name: 'Tabla del historial de operaciones' });
    expect(historyApi.list).toHaveBeenCalledWith({ desde: '2032-08-01', search: 'Ana' }, 1, expect.any(AbortSignal));
    expect(screen.getByText('1 operación encontrada con los filtros aplicados.')).toBeVisible();
  });

  it('escenario 2: sin registros para los criterios lo informa y conserva los filtros', async () => {
    vi.mocked(historyApi.list).mockResolvedValue(page([]));
    renderPage('/historial?desde=2032-08-11&hasta=2032-08-19');
    expect(await screen.findByText('No existen registros para los criterios seleccionados. Ajusta o limpia los filtros para continuar.')).toBeVisible();
    expect(screen.getByLabelText('Finalizada desde')).toHaveValue('2032-08-11');
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeEnabled();
  });

  it('sin filtros y sin operaciones informa que todavía no hay historial', async () => {
    vi.mocked(historyApi.list).mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('Todavía no hay operaciones terminadas registradas.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeDisabled();
  });

  it('valida el rango de fechas antes de consultar', async () => {
    renderPage();
    await screen.findByRole('region', { name: 'Tabla del historial de operaciones' });
    await userEvent.type(screen.getByLabelText('Finalizada desde'), '2032-08-20');
    await userEvent.type(screen.getByLabelText('Finalizada hasta'), '2032-08-01');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La fecha «desde» no puede ser posterior a «hasta».');
    expect(screen.getByLabelText('Finalizada hasta')).toHaveAttribute('aria-invalid', 'true');
    expect(historyApi.list).toHaveBeenCalledTimes(1);
  });

  it('pagina el historial de 12 en 12', async () => {
    vi.mocked(historyApi.list).mockResolvedValue({ ...page([item], 30), page: 1 });
    renderPage();
    expect(await screen.findByText('Página 1 de 3')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(historyApi.list).toHaveBeenLastCalledWith({}, 2, expect.any(AbortSignal)));
    expect(currentSearch).toBe('?page=2');
    await userEvent.click(await screen.findByRole('button', { name: 'Anterior' }));
    await waitFor(() => expect(currentSearch).toBe(''));
  });

  it('abre el detalle con la trazabilidad, entregas, incidencias y sostenibilidad, y devuelve el foco al cerrar', async () => {
    renderPage();
    const button = await screen.findByRole('button', { name: /Ver detalle de la operación ABC-123/ });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const heading = await screen.findByRole('heading', { name: 'Detalle de la operación · ABC-123' });
    expect(heading).toHaveFocus();
    const steps = within(screen.getByRole('list', { name: 'Línea de tiempo de la operación' })).getAllByRole('listitem');
    expect(steps.map(step => step.querySelector('strong')?.textContent)).toEqual(['Ruta generada', 'Ruta confirmada', 'Conductor asignado', 'Ruta iniciada', 'Ruta completada']);
    expect(steps[0]).toHaveTextContent('Planificación «Plan norte», versión 2');
    expect(steps[1]).toHaveTextContent('Por planificador@example.test · versión 1');
    expect(steps[3]).toHaveTextContent('Vehículo ABC-123 (VAN)');
    expect(steps[4]).toHaveTextContent('1 de 2 entregas realizadas · 1 incidencias');
    expect(screen.getByText('Pedido o2', { exact: false })).toBeVisible();
    expect(screen.getByText('Causa de no entrega: Cliente ausente')).toBeVisible();
    const incidents = screen.getByRole('list', { name: 'Incidencias de la parada 2' });
    expect(incidents).toHaveTextContent('Cliente ausente');
    expect(incidents).toHaveTextContent('Información complementaria: Se tocó dos veces');
    expect(screen.getByText('Medido en la operación')).toBeVisible();
    expect(screen.getByText('S/ 12.5')).toBeVisible();
    expect(screen.getByText('Tráfico ligero')).toBeVisible();
    expect(screen.getByText(/operador@example.test/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }));
    await waitFor(() => expect(button).toHaveFocus());
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('muestra una ruta anterior a US-020 sin confirmación ni sostenibilidad', async () => {
    vi.mocked(historyApi.detail).mockResolvedValue({ ...detail, confirmado_en: null, confirmado_por: null, version_confirmada: null, conductor: null, sostenibilidad: null, paradas: [] });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Ver detalle/ }));
    expect(await screen.findByText(/Sin confirmación registrada/)).toBeVisible();
    expect(screen.getByText('Ruta asignada antes de que existiera la confirmación (US-020)')).toBeVisible();
    expect(screen.getByText('Sin conductor')).toBeVisible();
    expect(screen.getByText('La operación no tiene entregas registradas.')).toBeVisible();
    expect(screen.getByText('Sin registro de sostenibilidad para esta operación.')).toBeVisible();
  });

  it('muestra valores de respaldo cuando faltan datos de la sostenibilidad o del confirmador', async () => {
    vi.mocked(historyApi.detail).mockResolvedValue({ ...detail, confirmado_por: null, version_confirmada: null, sostenibilidad: { ...detail.sostenibilidad!, costo_combustible: null, observaciones: null, registrador: null, origen_datos: 'ESTIMADO' } });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Ver detalle/ }));
    expect(await screen.findByText('Por usuario no disponible · versión —')).toBeVisible();
    expect(screen.getByText('No informado')).toBeVisible();
    expect(screen.getByText('Estimado a partir del cálculo')).toBeVisible();
    expect(screen.getByText(/usuario no disponible$/)).toBeVisible();
  });

  it('muestra el error del detalle con reintento y cierra la sesión expirada', async () => {
    vi.mocked(historyApi.detail).mockRejectedValueOnce(new ApiError('La operación no existe o todavía no ha terminado.', 404));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Ver detalle/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La operación no existe o todavía no ha terminado.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Detalle de la operación · ABC-123' })).toBeVisible();
    vi.mocked(historyApi.detail).mockRejectedValueOnce('fallo');
    await userEvent.click(screen.getByRole('button', { name: /Ver detalle/ }));
    await userEvent.click(screen.getByRole('button', { name: /Ver detalle/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar el detalle de la operación.');
  });

  it('cierra la sesión expirada al abrir el detalle', async () => {
    vi.mocked(historyApi.detail).mockRejectedValueOnce(new ApiError('Sesión expirada', 401));
    const { acceptSession } = renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Ver detalle/ }));
    await waitFor(() => expect(acceptSession).toHaveBeenCalledWith(null));
  });

  it('muestra el error del listado con reintento y cierra la sesión expirada', async () => {
    vi.mocked(historyApi.list).mockRejectedValueOnce(new ApiError('hasta: la fecha no existe.', 400));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('hasta: la fecha no existe.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
    expect(await screen.findByRole('region', { name: 'Tabla del historial de operaciones' })).toBeVisible();
    vi.mocked(historyApi.list).mockRejectedValueOnce('fallo');
    renderPage();
    expect(await screen.findByText('No se pudo consultar el historial.')).toBeVisible();
    vi.mocked(historyApi.list).mockRejectedValueOnce(new ApiError('Sesión expirada', 401));
    const { acceptSession } = renderPage();
    await waitFor(() => expect(acceptSession).toHaveBeenCalledWith(null));
  });

  it.each(['Usuario Final / Conductor', 'Auditor Externo'])('%s no accede al historial', async role => {
    renderPage('/historial', role);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Historial de operaciones' })).not.toBeInTheDocument());
    expect(historyApi.list).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Historial' })).not.toBeInTheDocument();
  });

  it('el Operador / Técnico accede al historial', async () => {
    renderPage('/historial', 'Operador / Técnico');
    expect(await screen.findByRole('heading', { name: 'Historial de operaciones', level: 1 })).toBeVisible();
  });
});

describe('US-023: consulta', () => {
  it('arma la consulta con la página y solo los filtros presentes', () => {
    expect(historyQuery({}, 1)).toBe('page=1&pageSize=12');
    expect(historyQuery({ desde: '2032-08-01', hasta: '2032-08-31', search: ' Ana ', con_incidencias: true, con_no_entregas: true }, 2))
      .toBe('page=2&pageSize=12&desde=2032-08-01&hasta=2032-08-31&search=Ana&con_incidencias=true&con_no_entregas=true');
    expect(historyQuery({ search: '   ', con_incidencias: false }, 1, 5)).toBe('page=1&pageSize=5');
  });
});
