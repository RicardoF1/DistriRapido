import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { RoutesPage } from './RoutesPage';
import { RouteDetailPage } from './RouteDetailPage';
import { routeFixture } from '../test/route-fixture';
import { ApiError } from '../services/api';
const mock = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), acceptSession: vi.fn() }));
vi.mock('../services/routes-api', () => ({ routesApi: mock }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ acceptSession: mock.acceptSession }) }));
vi.mock('../features/routes/RouteMap', () => ({ RouteMap: () => <div>Visor de geometría registrada</div> }));
beforeEach(() => { vi.resetAllMocks(); mock.list.mockResolvedValue({ items: [routeFixture], total: 21, page: 1, pageSize: 20 }); mock.get.mockResolvedValue(routeFixture); });
function open(detail = false) { return render(<MemoryRouter initialEntries={[detail ? '/rutas/r' : '/rutas']}><Routes><Route path="/rutas" element={<RoutesPage />} /><Route path="/rutas/:id" element={<RouteDetailPage />} /></Routes></MemoryRouter>); }
it('consulta lista y detalle con métricas registradas, no genera resultados', async () => { open(); await screen.findByText('21 recorridos registrados'); await userEvent.click(screen.getByRole('link', { name: 'Consultar recorrido' })); await screen.findByText('Visor de geometría registrada'); expect(screen.getByText('Destino sintético')).toBeVisible(); expect(screen.getByText('VOLUMEN_NO_EVALUABLE')).toBeVisible(); expect(screen.getByText('Regresa al origen')).toBeVisible(); });
it('pagina y busca sin contar solo una página', async () => { open(); await screen.findByText('21 recorridos registrados'); await userEvent.click(screen.getByRole('button', { name: 'Siguiente' })); await waitFor(() => expect(mock.list).toHaveBeenLastCalledWith(2, '', expect.any(AbortSignal))); await userEvent.type(screen.getByLabelText('Buscar por planificación o UUID'), 'plan'); await userEvent.click(screen.getByRole('button', { name: 'Buscar rutas' })); await waitFor(() => expect(mock.list).toHaveBeenLastCalledWith(1, 'plan', expect.any(AbortSignal))); });
it('distingue error de lista vacía y permite reintentar', async () => { mock.list.mockRejectedValueOnce(new Error('Migración pendiente')); open(); expect(await screen.findByRole('alert')).toHaveTextContent('Migración pendiente'); mock.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }); await userEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' })); expect(await screen.findByText('No hay recorridos registrados para esta consulta.')).toBeVisible(); });
it('ruta inexistente y sesión expirada mantienen errores explícitos', async () => { mock.get.mockRejectedValueOnce(new Error('Ruta no encontrada')); open(true); expect(await screen.findByRole('alert')).toHaveTextContent('Ruta no encontrada'); mock.get.mockRejectedValueOnce(new ApiError('Sesión expirada', 401)); await userEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' })); await waitFor(() => expect(mock.acceptSession).toHaveBeenCalledWith(null)); });
it('muestra desactualización sin reescribir la versión y consulta historial', async () => { mock.get.mockResolvedValue({ ...routeFixture, current_version: 2, current_warnings: ['PEDIDO_DESACTUALIZADO:o'] }); open(true); await screen.findByText(/Los pedidos actuales difieren/); await userEvent.selectOptions(screen.getByLabelText('Versión registrada'), '2'); await waitFor(() => expect(mock.get).toHaveBeenLastCalledWith('r', 2, expect.any(AbortSignal))); });
