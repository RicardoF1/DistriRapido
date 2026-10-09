import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { StrictMode } from 'react';
import { AuthContext } from '../auth/auth-context';
import { loginResponse } from '../../test/fixtures';
import { adminApi } from '../../services/admin-api';
import { ApiError } from '../../services/api';
import { AdminSummary } from './AdminSummary';
vi.mock('../../services/admin-api', () => ({ adminApi: { summary: vi.fn() } }));
function view() {
  const acceptSession = vi.fn();
  const session = { user: loginResponse.user, expiresAt: Date.now() + 900000 };
  const result = render(<AuthContext.Provider value={{ session, acceptSession, restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><AdminSummary /></AuthContext.Provider>);
  return { ...result, acceptSession };
}
beforeEach(() => vi.resetAllMocks());
it('muestra carga sin cantidades fabricadas', () => {
  vi.mocked(adminApi.summary).mockReturnValue(new Promise(() => {})); view();
  expect(screen.getByRole('status')).toHaveTextContent('Cargando indicadores'); expect(screen.queryByText('0')).not.toBeInTheDocument();
});
it.each([0, 1, 251])('muestra totales y vacío reales: %s', async count => {
  vi.mocked(adminApi.summary).mockResolvedValue({ totalOrders: count, pendingOrders: count, totalUsers: 7, ordersByState: count ? [{ state: 'PENDIENTE', count }] : [] });
  view(); await screen.findByText('Pedidos registrados');
  expect(within(screen.getByText('Pedidos registrados').parentElement!).getByText(String(count))).toBeVisible();
  expect(screen.queryByText('No hay pedidos registrados.') !== null).toBe(count === 0); expect(adminApi.summary).toHaveBeenCalledTimes(1);
});
it('distribución no iguala pendientes y total', async () => {
  vi.mocked(adminApi.summary).mockResolvedValue({ totalOrders: 6, pendingOrders: 2, totalUsers: 3, ordersByState: [{ state: 'PENDIENTE', count: 2 }, { state: 'ESTADO_EXISTENTE_EN_DATOS', count: 4 }] });
  view(); await screen.findByText('ESTADO_EXISTENTE_EN_DATOS');
  expect(screen.getByText('Pedidos pendientes').parentElement).toHaveTextContent('2'); expect(screen.getByText('Pedidos registrados').parentElement).toHaveTextContent('6');
});
it('error no muestra cero y reintento recupera indicadores', async () => {
  vi.mocked(adminApi.summary).mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ totalOrders: 1, pendingOrders: 1, totalUsers: 1, ordersByState: [{ state: 'PENDIENTE', count: 1 }] });
  view(); expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar'); expect(screen.queryByText('0')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar resumen' })); await screen.findByText('Pedidos registrados'); expect(adminApi.summary).toHaveBeenCalledTimes(2);
});
it('401 descarta sesión y 403 no muestra cantidades', async () => {
  vi.mocked(adminApi.summary).mockRejectedValue(new ApiError('expired', 401)); const result = view();
  await waitFor(() => expect(result.acceptSession).toHaveBeenCalledWith(null)); expect(screen.queryByText('0')).not.toBeInTheDocument();
});
it('aborta al desmontarse sin aceptar respuesta tardía', async () => {
  vi.mocked(adminApi.summary).mockReturnValue(new Promise(() => {})); const result=view(); await waitFor(() => expect(adminApi.summary).toHaveBeenCalledTimes(1)); const signal=vi.mocked(adminApi.summary).mock.calls[0][0]!;
  result.unmount(); expect(signal.aborted).toBe(true);
});

it('StrictMode descarta su primer efecto sin duplicar la consulta', async () => {
  vi.mocked(adminApi.summary).mockResolvedValue({ totalOrders: 0, pendingOrders: 0, totalUsers: 0, ordersByState: [] });
  const session = { user: loginResponse.user, expiresAt: Date.now() + 900000 };
  render(<StrictMode><AuthContext.Provider value={{ session, acceptSession: vi.fn(), restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><AdminSummary /></AuthContext.Provider></StrictMode>);
  await screen.findByText('Pedidos registrados'); expect(adminApi.summary).toHaveBeenCalledTimes(1);
});
it('403 muestra denegación sin cantidades ni sesión alterada', async () => {
  vi.mocked(adminApi.summary).mockRejectedValue(new ApiError('forbidden', 403)); const result=view();
  expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso'); expect(result.acceptSession).not.toHaveBeenCalled(); expect(screen.queryByText('0')).not.toBeInTheDocument();
});
