import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../routes/AppRoutes';
import { AuthContext } from '../features/auth/auth-context';
import { ApiError } from '../services/api';
import { loginResponse } from '../test/fixtures';
import { operationsApi, type OperationalRoute, type OperationalRouteDetail, type OperationsPage } from '../services/operations-api';

vi.mock('../services/operations-api', async () => ({
  ...await vi.importActual<typeof import('../services/operations-api')>('../services/operations-api'),
  operationsApi: { summary: vi.fn(), list: vi.fn(), detail: vi.fn() },
}));
vi.mock('../services/driver-profile-api', async () => ({
  ...await vi.importActual<typeof import('../services/driver-profile-api')>('../services/driver-profile-api'),
  driverProfileApi: { me: vi.fn().mockResolvedValue({ conductor_id: 'd', nombre_completo: 'Conductor', estado: 'ACTIVO' }), routes: vi.fn().mockResolvedValue([]), route: vi.fn(), updateDelivery: vi.fn(), createIncident: vi.fn() },
}));

const route: OperationalRoute = {
  ruta_id: 'r1', estado: 'EN_CURSO', asignado_en: '2030-03-10T15:00:00Z', iniciado_en: '2030-03-10T15:10:00Z', finalizado_en: null, current_version: 1,
  conductor: { conductor_id: 'd1', nombre_completo: 'Ana Operativa' },
  version: { numero: 1, distancia_m: '1000', duracion_s: '600', vehiculo: { vehiculo_id: 'v1', placa: 'ABC-123', tipo: 'VAN' } },
  deliveries: { total: 3, pending: 1, delivered: 1, not_delivered: 1, processed: 2, percentage: 66.67 }, incidents: 1,
};
const page = (items: OperationalRoute[], total = items.length): OperationsPage => ({ items, total, page: 1, pageSize: 10 });
const detail: OperationalRouteDetail = {
  ...route, conductor: { conductor_id: 'd1', nombre_completo: 'Ana Operativa', telefono: 'SIN-DATO' }, version: route.version!,
  stops: [
    { parada_id: 'p1', pedido_id: 'o1', secuencia: 1, direccion: 'Jr. Real 100', estado_entrega: 'NO_ENTREGADA', causa_no_entrega: 'Cliente ausente', atendido_en: '2030-03-10T16:00:00Z', pedido_estado: 'EN_RUTA', incidencias: [{ incidencia_id: 'i1', tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende', detalle_complementario: 'Se llamó al cliente', registrado_en: '2030-03-10T15:55:00Z' }] },
    { parada_id: 'p2', pedido_id: 'o2', secuencia: 2, direccion: null, estado_entrega: 'PENDIENTE', causa_no_entrega: null, atendido_en: null, pedido_estado: 'EN_RUTA', incidencias: [] },
  ],
};

let currentSearch = '';
function LocationProbe() { currentSearch = useLocation().search; return null; }
function renderPage(path = '/seguimiento', role = 'Administrador') {
  const acceptSession = vi.fn();
  const session = { expiresAt: Date.now() + 900000, user: { ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role } } };
  render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ session, acceptSession, restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><AppRoutes /><LocationProbe /></AuthContext.Provider></MemoryRouter>);
  return { acceptSession };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(operationsApi.summary).mockResolvedValue({ routes: { ASIGNADA: 2, EN_CURSO: 1, COMPLETADA: 4 }, deliveries: { PENDIENTE: 5, ENTREGADA: 9, NO_ENTREGADA: 1 }, incidents: 3 });
  vi.mocked(operationsApi.list).mockResolvedValue(page([route]));
  vi.mocked(operationsApi.detail).mockResolvedValue(detail);
});

describe('US-019 / RF-016: seguimiento operativo', () => {
  it('muestra el resumen y las rutas en operación con su progreso', async () => {
    renderPage();
    const summary = await screen.findByRole('region', { name: 'Resumen general de la operación' });
    expect(await within(summary).findByText('Rutas en curso')).toBeVisible();
    expect(within(summary).getByText('Incidencias registradas').nextSibling).toHaveTextContent('3');
    const table = await screen.findByRole('region', { name: 'Rutas en operación' });
    const row = within(table).getByRole('row', { name: /Ana Operativa/ });
    expect(row).toHaveTextContent('ABC-123');
    expect(row).toHaveTextContent('En curso');
    expect(row).toHaveTextContent('2/3 (66.67%)');
    expect(operationsApi.list).toHaveBeenCalledWith({}, 1, expect.any(AbortSignal));
    expect(screen.getByRole('link', { name: 'Seguimiento operativo' })).toHaveAttribute('aria-current', 'page');
  });

  it('aplica los filtros permitidos, los guarda en la URL y vuelve a la primera página', async () => {
    renderPage('/seguimiento?page=2');
    await screen.findByRole('region', { name: 'Rutas en operación' });
    await userEvent.selectOptions(screen.getByLabelText('Estado de la ruta'), 'En curso');
    await userEvent.selectOptions(screen.getByLabelText('Con entregas en estado'), 'No entregada');
    await userEvent.type(screen.getByLabelText('Asignada desde'), '2030-03-01');
    await userEvent.type(screen.getByLabelText('Asignada hasta'), '2030-03-31');
    await userEvent.type(screen.getByLabelText('Placa o conductor'), '  ABC ');
    await userEvent.click(screen.getByLabelText('Solo rutas con incidencias'));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() => expect(operationsApi.list).toHaveBeenLastCalledWith({ estado: 'EN_CURSO', estado_entrega: 'NO_ENTREGADA', desde: '2030-03-01', hasta: '2030-03-31', con_incidencias: true, search: 'ABC' }, 1, expect.any(AbortSignal)));
    expect(new URLSearchParams(currentSearch).get('page')).toBeNull();
    expect(new URLSearchParams(currentSearch).get('estado')).toBe('EN_CURSO');
    expect(await screen.findByText('1 ruta encontrada con los filtros aplicados.')).toBeVisible();
  });

  it('informa que no hay resultados y mantiene la consulta disponible', async () => {
    vi.mocked(operationsApi.list).mockResolvedValue(page([]));
    renderPage('/seguimiento?estado=COMPLETADA&con_incidencias=true');
    expect(await screen.findByText(/No existen operaciones que coincidan con los filtros aplicados/)).toBeVisible();
    expect(screen.getByLabelText('Estado de la ruta')).toHaveValue('COMPLETADA');
    expect(screen.getByLabelText('Solo rutas con incidencias')).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => expect(operationsApi.list).toHaveBeenLastCalledWith({}, 1, expect.any(AbortSignal)));
    expect(screen.getByLabelText('Estado de la ruta')).toHaveValue('');
    expect(currentSearch).toBe('');
  });

  it('distingue la ausencia de operaciones sin filtros', async () => {
    vi.mocked(operationsApi.list).mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('Todavía no hay rutas asignadas en operación.')).toBeVisible();
  });

  it('ignora parámetros de URL no permitidos', async () => {
    renderPage('/seguimiento?estado=GENERADA&estado_entrega=PERDIDA&desde=ayer&con_incidencias=si');
    await screen.findByRole('region', { name: 'Rutas en operación' });
    expect(operationsApi.list).toHaveBeenCalledWith({}, 1, expect.any(AbortSignal));
  });

  it('rechaza un rango de fechas invertido sin consultar al servidor', async () => {
    renderPage();
    await screen.findByRole('region', { name: 'Rutas en operación' });
    const calls = vi.mocked(operationsApi.list).mock.calls.length;
    await userEvent.type(screen.getByLabelText('Asignada desde'), '2030-03-31');
    await userEvent.type(screen.getByLabelText('Asignada hasta'), '2030-03-01');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La fecha «desde» no puede ser posterior a «hasta».');
    expect(screen.getByLabelText('Asignada desde')).toHaveAttribute('aria-invalid', 'true');
    expect(operationsApi.list).toHaveBeenCalledTimes(calls);
  });

  it('muestra el rechazo del backend y permite reintentar', async () => {
    vi.mocked(operationsApi.list).mockRejectedValueOnce(new ApiError('estado: usa ASIGNADA, EN_CURSO o COMPLETADA.', 400));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('estado: usa ASIGNADA, EN_CURSO o COMPLETADA.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
    expect(await screen.findByRole('row', { name: /Ana Operativa/ })).toBeVisible();
  });

  it('una sesión vencida cierra la sesión local', async () => {
    vi.mocked(operationsApi.list).mockRejectedValue(new ApiError('Sesión vencida', 401));
    const { acceptSession } = renderPage();
    await waitFor(() => expect(acceptSession).toHaveBeenCalledWith(null));
  });

  it('detalla entregas, causas e incidencias y devuelve el foco al cerrar', async () => {
    renderPage();
    const open = await screen.findByRole('button', { name: 'Ver entregas de la ruta ABC-123 de Ana Operativa' });
    await userEvent.click(open);
    const panel = await screen.findByRole('region', { name: /Entregas de la ruta/ });
    expect(await within(panel).findByText(/Jr\. Real 100/)).toBeVisible();
    expect(within(panel).getByText('Causa de no entrega: Cliente ausente')).toBeVisible();
    expect(within(panel).getByText('No entregada')).toBeVisible();
    expect(within(panel).getByRole('list', { name: 'Incidencias de la parada 1' })).toHaveTextContent('Cliente ausente');
    expect(within(panel).getByText('Información complementaria: Se llamó al cliente')).toBeVisible();
    expect(within(panel).getByText(/Pedido o2/)).toBeVisible();
    expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(operationsApi.detail).toHaveBeenCalledWith('r1', expect.any(AbortSignal));
    await userEvent.click(within(panel).getByRole('button', { name: 'Cerrar detalle' }));
    expect(screen.queryByRole('region', { name: /Entregas de la ruta/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ver entregas de la ruta ABC-123 de Ana Operativa' })).toHaveFocus());
  });

  it('pagina los resultados', async () => {
    vi.mocked(operationsApi.list).mockResolvedValue(page([route], 25));
    renderPage();
    expect(await screen.findByText('Página 1 de 3')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(operationsApi.list).toHaveBeenLastCalledWith({}, 2, expect.any(AbortSignal)));
    expect(new URLSearchParams(currentSearch).get('page')).toBe('2');
  });

  it.each(['Usuario Final / Conductor', 'Auditor Externo'])('%s no accede al seguimiento', async role => {
    renderPage('/seguimiento', role);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Seguimiento operativo' })).not.toBeInTheDocument());
    expect(operationsApi.list).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Seguimiento operativo' })).not.toBeInTheDocument();
  });

  it('el Operador / Técnico accede al seguimiento', async () => {
    renderPage('/seguimiento', 'Operador / Técnico');
    expect(await screen.findByRole('heading', { name: 'Seguimiento operativo', level: 1 })).toBeVisible();
  });
});
