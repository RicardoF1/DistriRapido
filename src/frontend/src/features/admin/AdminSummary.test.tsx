import { act, render, screen, waitFor, within } from '@testing-library/react';
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
  view(); await screen.findByText('Pedidos por estado');
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
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar resumen' })); await screen.findByText('Pedidos por estado'); expect(adminApi.summary).toHaveBeenCalledTimes(2);
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
  await screen.findByText('Pedidos por estado'); expect(adminApi.summary).toHaveBeenCalledTimes(1);
});
it('403 muestra denegación sin cantidades ni sesión alterada', async () => {
  vi.mocked(adminApi.summary).mockRejectedValue(new ApiError('forbidden', 403)); const result=view();
  expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso'); expect(result.acceptSession).not.toHaveBeenCalled(); expect(screen.queryByText('0')).not.toBeInTheDocument();
});

it('tarjetas de cantidades permanecen visibles durante carga y error', async () => {
  vi.mocked(adminApi.summary).mockRejectedValue(new Error('offline')); view();
  expect(screen.getByText('Pedidos registrados')).toBeVisible();
  expect(screen.getAllByLabelText('Cantidad pendiente de carga')).toHaveLength(3);
  await screen.findByRole('alert');
  expect(screen.getAllByText('No disponible')).toHaveLength(3);
  expect(screen.queryByText('0')).not.toBeInTheDocument();
});
it('permite actualizar totales sin reemplazar registros ni mostrar datos anteriores durante carga', async () => {
  vi.mocked(adminApi.summary).mockResolvedValueOnce({totalOrders:2,pendingOrders:2,totalUsers:1,ordersByState:[{state:'PENDIENTE',count:2}]}).mockResolvedValueOnce({totalOrders:3,pendingOrders:3,totalUsers:1,ordersByState:[{state:'PENDIENTE',count:3}]});
  view(); await screen.findByText('Pedidos por estado');
  await userEvent.click(screen.getByRole('button',{name:'Actualizar resumen'}));
  await waitFor(()=>expect(screen.getByText('Pedidos registrados').parentElement).toHaveTextContent('3'));
  expect(adminApi.summary).toHaveBeenCalledTimes(2);
});
it('informa de API desactualizada sin fabricar totales', async () => {
  vi.mocked(adminApi.summary).mockRejectedValue(new ApiError('missing',404)); view();
  expect(await screen.findByRole('alert')).toHaveTextContent('Inicia la API de esta misma versión');
  expect(screen.queryByText('0')).not.toBeInTheDocument();
});
it('mantiene una lista de definición válida con el icono decorativo dentro de cada término', async () => {
  vi.mocked(adminApi.summary).mockResolvedValue({ totalOrders: 6, pendingOrders: 2, totalUsers: 3, ordersByState: [{ state: 'PENDIENTE', count: 2 }] });
  const { container } = view(); await screen.findByText('Pedidos por estado');
  const metrics = container.querySelector('dl.admin-metrics')!;
  const groups = [...metrics.children];
  expect(groups.map(group => group.tagName)).toEqual(['DIV', 'DIV', 'DIV']);
  for (const group of groups) expect([...group.children].map(child => child.tagName)).toEqual(['DT', 'DD']);
  expect(groups.map(group => [group.querySelector('dt')!.textContent, group.querySelector('dd')!.textContent])).toEqual([['Pedidos registrados', '6'], ['Pedidos pendientes', '2'], ['Usuarios registrados', '3']]);
  for (const icon of metrics.querySelectorAll('.admin-metric-icon')) {
    expect(icon.parentElement!.tagName).toBe('DT');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  }
  expect(within(metrics as HTMLElement).getAllByRole('term').map(term => term.textContent)).toEqual(['Pedidos registrados', 'Pedidos pendientes', 'Usuarios registrados']);
  expect(within(metrics as HTMLElement).getAllByRole('definition').map(value => value.textContent)).toEqual(['6', '2', '3']);
});
it('valor de métrica: error, pendiente de carga y cantidad con formato es-PE', async () => {
  let resolve!: (value: Awaited<ReturnType<typeof adminApi.summary>>) => void;
  vi.mocked(adminApi.summary).mockReturnValueOnce(new Promise(done => { resolve = done; })).mockRejectedValueOnce(new Error('offline'));
  const { container } = view();
  const values = () => [...container.querySelectorAll('dl.admin-metrics dd')];
  // Sin datos todavía: guion con nombre accesible.
  for (const value of values()) { expect(value).toHaveTextContent('—'); expect(value.querySelector('span')).toHaveAttribute('aria-label', 'Cantidad pendiente de carga'); }
  // Con datos: cantidades con formato es-PE.
  await act(async () => resolve({ totalOrders: 1234567, pendingOrders: 2500, totalUsers: 7, ordersByState: [] }));
  await screen.findByText('Pedidos por estado');
  expect(values().map(value => value.textContent)).toEqual([(1234567).toLocaleString('es-PE'), (2500).toLocaleString('es-PE'), '7']);
  expect(values()[0].textContent).not.toBe('1234567');
  // Con error: «No disponible» sin cantidades.
  await userEvent.click(screen.getByRole('button', { name: 'Actualizar resumen' }));
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(values().map(value => value.textContent)).toEqual(['No disponible', 'No disponible', 'No disponible']);
});
