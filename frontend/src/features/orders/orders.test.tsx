import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../../routes/AppRoutes';
import { AuthProvider } from '../auth/AuthProvider';
import { authApi, ApiError } from '../../services/api';
import { ordersApi } from '../../services/orders-api';
import { loginResponse } from '../../test/fixtures';
import type { RegisteredOrder } from '../../types/orders';
vi.mock('../../services/orders-api', () => ({ ordersApi: { create: vi.fn() } }));
vi.mock('../../services/api', async () => ({ ...await vi.importActual<typeof import('../../services/api')>('../../services/api'), authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() } }));
const identity = (role = 'Administrador') => ({ ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role }, expiresAt: Date.now() + 900000 });
const result: RegisteredOrder = { pedido_id: 'registered-id', cliente_id: 'client-id', peso_kg: '2.5', volumen_m3: '0.015', ventana_inicio: '2026-10-02T09:00:00Z', ventana_fin: '2026-10-02T11:00:00Z', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', estado: 'PENDIENTE', creado_en: '2026-10-01T00:00:00Z' };
const labels = { nombre: 'Nombre del cliente', direccion: 'Dirección de entrega', latitud: 'Latitud', longitud: 'Longitud', peso: 'Peso (kg)', volumen: 'Volumen (m³)', inicio: 'Inicio de ventana de entrega', fin: 'Fin de ventana de entrega' };
function setup(role = 'Administrador') {
  vi.mocked(authApi.me).mockResolvedValue(identity(role));
  return render(<MemoryRouter initialEntries={['/pedidos/nuevo']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
}
async function fill() {
  await screen.findByRole('form', { name: 'Registrar pedido' });
  for (const [label, value] of [[labels.nombre, 'Cliente prueba'], [labels.direccion, 'Destino prueba'], [labels.latitud, '-12.065'], [labels.longitud, '-75.204'], [labels.peso, '2.5'], [labels.volumen, '0.015'], [labels.inicio, '2026-10-02T09:00'], [labels.fin, '2026-10-02T11:00']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'ESTANDAR'); await userEvent.selectOptions(screen.getByLabelText('Tipo de producto'), 'NO_PERECEDERO');
}
beforeEach(() => { vi.resetAllMocks(); vi.mocked(authApi.logout).mockResolvedValue(undefined); vi.mocked(ordersApi.create).mockResolvedValue(result); });
describe('US-004 Registrar pedido', () => {
  it.each(['Administrador', 'Operador / Técnico'])('%s registra y recibe confirmación sin pantalla de consulta', async role => {
    setup(role); await fill(); await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(await screen.findByText('Pedido registrado correctamente')).toBeVisible(); expect(screen.getByText('Código: registered-id')).toBeVisible();
    expect(ordersApi.create).toHaveBeenCalledWith(expect.objectContaining({ cliente: { nombre: 'Cliente prueba', direccion: 'Destino prueba', latitud: -12.065, longitud: -75.204 }, peso_kg: 2.5, volumen_m3: 0.015, prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO' }));
    expect(vi.mocked(ordersApi.create).mock.calls[0][0]).not.toHaveProperty('estado');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar otro pedido' })); expect(screen.getByLabelText(labels.nombre)).toHaveValue('');
  });
  it.each(['Usuario Final / Conductor', 'Auditor Externo'])('%s no accede al formulario', async role => {
    setup(role); expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible(); expect(screen.queryByRole('form')).not.toBeInTheDocument(); expect(ordersApi.create).not.toHaveBeenCalled();
  });
  it('sin sesión vuelve al login', async () => {
    setup(); vi.mocked(authApi.me).mockRejectedValue(new ApiError('Sin sesión', 401));
    await act(async () => window.dispatchEvent(new Event('focus'))); expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('rechaza datos incompletos y enfoca primer campo', async () => {
    setup(); await screen.findByRole('form'); await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(screen.getByLabelText(labels.nombre)).toHaveFocus(); expect(screen.getByText('Selecciona una prioridad permitida.')).toBeVisible(); expect(ordersApi.create).not.toHaveBeenCalled();
    await fill(); expect(screen.getByLabelText(labels.nombre)).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Selecciona una prioridad permitida.')).not.toBeInTheDocument();
  });
  it('rechaza rangos, precisión y ventana invertida', async () => {
    setup(); await fill();
    for (const [label, value] of [[labels.latitud, '91'], [labels.longitud, '-181'], [labels.peso, '0'], [labels.volumen, '0.0001'], [labels.fin, '2026-10-02T08:00']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(screen.getByText('Indica un fin posterior al inicio de la ventana de entrega.')).toBeVisible(); expect(ordersApi.create).not.toHaveBeenCalled();
  });
  it('mantiene formulario durante focus/visibility y /auth/me pendiente', async () => {
    setup(); await fill(); const input = screen.getByLabelText(labels.nombre);
    for (const event of ['focus', 'visibilitychange']) {
      let resolve!: (value: ReturnType<typeof identity>) => void;
      vi.mocked(authApi.me).mockReturnValueOnce(new Promise(done => { resolve = done; }));
      const calls = vi.mocked(authApi.me).mock.calls.length;
      await act(async () => { if (event === 'focus') window.dispatchEvent(new Event(event)); else document.dispatchEvent(new Event(event)); });
      await waitFor(() => expect(authApi.me).toHaveBeenCalledTimes(calls + 1)); expect(screen.getByLabelText(labels.nombre)).toBe(input);
      await act(async () => resolve(identity())); expect(input).toHaveValue('Cliente prueba'); expect(screen.getByLabelText(labels.peso)).toHaveValue('2.5');
    }
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });
  it('bloquea doble envío mientras una solicitud está pendiente', async () => {
    let resolve!: (value: RegisteredOrder) => void; vi.mocked(ordersApi.create).mockReturnValue(new Promise(done => { resolve = done; }));
    setup(); await fill(); const form = screen.getByRole('form');
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(ordersApi.create).toHaveBeenCalledTimes(1); expect(screen.getByRole('button', { name: 'Registrando pedido…' })).toBeDisabled();
    await act(async () => resolve(result)); expect(screen.getByText('Pedido registrado correctamente')).toBeVisible();
  });
  it.each([new ApiError('Datos inválidos', 400), new ApiError('No autorizado', 403), 'unexpected'])('muestra error sin borrar borrador %#', async cause => {
    vi.mocked(ordersApi.create).mockRejectedValue(cause); setup(); await fill(); await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(await screen.findByRole('alert')).toBeVisible(); expect(screen.getByLabelText(labels.nombre)).toHaveValue('Cliente prueba');
  });
  it('401 al registrar retira formulario y vuelve a login', async () => {
    vi.mocked(ordersApi.create).mockRejectedValue(new ApiError('Expirada', 401)); setup(); await fill(); await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('logout retira el borrador', async () => {
    setup(); await fill(); await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' })); expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
});
