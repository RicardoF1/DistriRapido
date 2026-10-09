import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { OrderDetailPage } from './OrderDetailPage';
import { ordersApi } from '../services/orders-api';
import { AuthContext } from '../features/auth/auth-context';

vi.mock('../services/orders-api', () => ({ ordersApi: { get: vi.fn(), updateStatus: vi.fn() } }));
const order = { pedido_id: 'order-id', cliente_id: 'client-id', peso_kg: '2.5', volumen_m3: null, descripcion_carga: null, estado: 'PENDIENTE' as const, prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', creado_en: '2026-10-01T12:00:00Z', ventana_inicio: '2026-10-02T14:00:00Z', ventana_fin: '2026-10-02T16:00:00Z', cliente: { cliente_id: 'client-id', nombre: 'Cliente', telefono: null, email: null, direccion: 'Destino', referencia: null, latitud: '-12', longitud: '-75', estado: 'ACTIVO' } };

beforeEach(() => { vi.resetAllMocks(); vi.mocked(ordersApi.get).mockResolvedValue(order); vi.mocked(ordersApi.updateStatus).mockResolvedValue({ ...order, estado: 'EN_PREPARACION' }); });
describe('US-006 detalle de pedido', () => {
  it('muestra transiciones permitidas y confirma la actualización', async () => {
    render(<AuthContext.Provider value={{ session: null, acceptSession: vi.fn(), restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><MemoryRouter initialEntries={['/pedidos/order-id']}><Routes><Route path="/pedidos/:id" element={<OrderDetailPage />} /></Routes></MemoryRouter></AuthContext.Provider>);
    await screen.findByText('Pendiente');
    await userEvent.selectOptions(screen.getByLabelText('Actualizar estado'), 'EN_PREPARACION');
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar estado' }));
    expect(ordersApi.updateStatus).toHaveBeenCalledWith('order-id', 'EN_PREPARACION');
    expect(await screen.findByRole('status')).toHaveTextContent('Estado actualizado correctamente.');
  });
});
