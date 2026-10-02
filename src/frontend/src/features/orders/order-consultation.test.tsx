import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../../routes/AppRoutes';
import { AuthProvider } from '../auth/AuthProvider';
import { authApi, ApiError } from '../../services/api';
import { ordersApi } from '../../services/orders-api';
import { loginResponse } from '../../test/fixtures';
import { formatOrderDate } from './order-display';
import type { OrderRead } from '../../types/orders';
vi.mock('../../services/orders-api', () => ({ ordersApi: { list: vi.fn(), get: vi.fn() } }));
vi.mock('../../services/api', async () => ({ ...await vi.importActual<typeof import('../../services/api')>('../../services/api'), authApi: { me: vi.fn(), logout: vi.fn() } }));
const id = '10000000-0000-4000-8000-000000000001';
const order: OrderRead = { pedido_id: id, cliente_id: id, peso_kg: '2.5', volumen_m3: null, descripcion_carga: 'Caja', estado: 'PENDIENTE', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', creado_en: '2026-10-01T12:00:00Z', ventana_inicio: '2026-10-02T14:00:00Z', ventana_fin: '2026-10-02T16:00:00Z', cliente: { cliente_id: id, nombre: 'Comercial Mantaro', direccion: 'Av. Giraldez', referencia: 'Puerta azul', telefono: null, email: null, estado: 'ACTIVO', latitud: '-12.065', longitud: '-75.204' } };
const page = { items: [order], total: 1, page: 1, pageSize: 20 };
function setup(path = '/pedidos') { return render(<MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>); }
beforeEach(() => {
  vi.resetAllMocks(); vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, expiresAt: Date.now() + 900000 });
  vi.mocked(ordersApi.list).mockResolvedValue(page); vi.mocked(ordersApi.get).mockResolvedValue(order);
});
it('listado con cliente, dirección, volumen NULL y fecha Lima; navega al detalle', async () => {
  setup(); const table = await screen.findByRole('table');
  expect(within(table).getByText('Comercial Mantaro')).toBeVisible(); expect(within(table).getByText('Av. Giraldez')).toBeVisible();
  expect(within(table).getByText('No informado')).toBeVisible(); expect(within(table).getByText(/02\/10\/2026 09:00 AM/)).toBeVisible();
  await userEvent.click(screen.getByRole('link', { name: `Ver detalle de ${id}` }));
  expect(await screen.findByRole('heading', { name: 'Detalle del pedido' })).toBeVisible();
  expect(await screen.findByText('Puerta azul')).toBeVisible(); expect(screen.getByText('Caja')).toBeVisible();
  expect(ordersApi.get).toHaveBeenCalledWith(id, expect.any(AbortSignal));
  expect(screen.queryByRole('button', { name: /Editar|Cancelar|Eliminar|Cambiar estado/ })).not.toBeInTheDocument();
});
it('muestra carga y vacío', async () => {
  let resolve!: (value: typeof page) => void; vi.mocked(ordersApi.list).mockReturnValue(new Promise(done => { resolve = done; }));
  setup(); expect(await screen.findByText('Cargando pedidos…')).toBeVisible();
  await act(async () => resolve({ ...page, items: [], total: 0 })); expect(screen.getByText('No hay pedidos registrados.')).toBeVisible();
});
it('búsqueda con debounce, filtros combinados y limpiar filtros', async () => {
  setup(); await screen.findByRole('table');
  fireEvent.change(screen.getByLabelText('Buscar cliente, dirección o ID'), { target: { value: 'Mantaro' } });
  expect(ordersApi.list).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(ordersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Mantaro', page: 1 }), expect.any(AbortSignal)));
  await userEvent.selectOptions(screen.getByLabelText('Estado'), 'PENDIENTE');
  await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'ESTANDAR');
  await userEvent.selectOptions(screen.getByLabelText('Tipo de producto'), 'NO_PERECEDERO');
  expect(ordersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Mantaro', estado: 'PENDIENTE', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO' }), expect.any(AbortSignal));
  vi.mocked(ordersApi.list).mockResolvedValue({ ...page, items: [], total: 0 });
  await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'EXPRESS');
  expect(await screen.findByText('No se encontraron pedidos con los criterios seleccionados.')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
  expect(screen.getByLabelText('Buscar cliente, dirección o ID')).toHaveValue('');
  expect(ordersApi.list).toHaveBeenLastCalledWith({ search: '', estado: '', prioridad: '', tipo_producto: '', page: 1, pageSize: 20 }, expect.any(AbortSignal));
});
it('paginación acotada y filtro vuelve a página 1', async () => {
  vi.mocked(ordersApi.list).mockResolvedValue({ ...page, total: 21 }); setup();
  await screen.findByRole('table'); expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(await screen.findByText(/Página 2 de 2/)).toBeVisible(); expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Anterior' })); await screen.findByText(/Página 1 de 2/);
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' })); await screen.findByText(/Página 2 de 2/);
  await userEvent.selectOptions(screen.getByLabelText('Estado'), 'PENDIENTE'); await screen.findByText(/Página 1 de 2/);
});
it.each(['/pedidos', `/pedidos/${id}`])('error genérico y reintento %s', async path => {
  vi.mocked(ordersApi.list).mockRejectedValueOnce(new Error('SQL internal password')); vi.mocked(ordersApi.get).mockRejectedValueOnce(new Error('SQL internal password'));
  setup(path); expect(await screen.findByRole('alert')).toHaveTextContent(/No se pud/); expect(screen.queryByText(/SQL internal/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  if (path === '/pedidos') await screen.findByRole('table'); else await screen.findByText('Puerta azul');
});
it.each([403, 404])('detalle maneja HTTP %s', async status => {
  vi.mocked(ordersApi.get).mockRejectedValue(new ApiError('internal', status)); setup(`/pedidos/${id}`);
  expect(await screen.findByRole('alert')).toHaveTextContent(status === 404 ? 'Pedido no encontrado.' : 'No tienes permisos para consultar pedidos.');
});
it.each(['Usuario Final / Conductor', 'Auditor Externo'])('bloquea URL directa para %s', async role => {
  vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role }, expiresAt: Date.now() + 900000 });
  setup(`/pedidos/${id}`); await screen.findByRole('heading', { name: 'Acceso permitido' });
  expect(ordersApi.get).not.toHaveBeenCalled(); expect(screen.queryByRole('link', { name: 'Consultar pedidos' })).not.toBeInTheDocument();
});
it.each(['/pedidos', `/pedidos/${id}`])('401 restaura login %s', async path => {
  vi.mocked(ordersApi.list).mockRejectedValue(new ApiError('expired', 401)); vi.mocked(ordersApi.get).mockRejectedValue(new ApiError('expired', 401));
  setup(path); expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
});
it('sin sesión no consulta', async () => {
  vi.mocked(authApi.me).mockRejectedValue(new ApiError('expired', 401)); setup(); await screen.findByRole('heading', { name: 'Acceso al sistema' }); expect(ordersApi.list).not.toHaveBeenCalled();
});
it('fecha AM/PM en Lima incluye cambio de día y fecha inválida', () => {
  expect(formatOrderDate('2026-10-03T04:00:00Z')).toBe('02/10/2026 11:00 PM');
  expect(formatOrderDate('2026-10-03T06:00:00Z')).toBe('03/10/2026 01:00 AM');
  expect(formatOrderDate('invalid')).toBe('Fecha no disponible');
});
