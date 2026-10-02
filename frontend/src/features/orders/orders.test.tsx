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
import { geocoding } from '../../services/geocoding';
vi.mock('./DeliveryMap', () => ({ DeliveryMap: ({ onChange }: { onChange: (point: { latitud: number; longitud: number }) => void }) => <button type="button" onClick={() => onChange({ latitud: -12.065, longitud: -75.204 })}>Seleccionar destino de prueba</button> }));
vi.mock('../../services/geocoding', () => ({ geocoding: { search: vi.fn().mockResolvedValue([]), reverse: vi.fn().mockRejectedValue(new Error('offline')) } }));
vi.mock('../../services/orders-api', () => ({ ordersApi: { create: vi.fn() } }));
vi.mock('../../services/api', async () => ({ ...await vi.importActual<typeof import('../../services/api')>('../../services/api'), authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() } }));
const identity = (role = 'Administrador') => ({ ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role }, expiresAt: Date.now() + 900000 });
const result: RegisteredOrder = { pedido_id: 'registered-id', cliente_id: 'client-id', peso_kg: '2.5', volumen_m3: '0.015', ventana_inicio: '2026-10-02T09:00:00Z', ventana_fin: '2026-10-02T11:00:00Z', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', estado: 'PENDIENTE', creado_en: '2026-10-01T00:00:00Z' };
const labels = { nombre: 'Nombre del cliente', direccion: 'Dirección de entrega', latitud: 'Latitud', longitud: 'Longitud', peso: 'Peso (kg)', volumen: 'Volumen (m³) — opcional', fechaInicio: 'Fecha de inicio', inicio: 'Hora de inicio', fechaFin: 'Fecha de fin', fin: 'Hora de fin' };
function setup(role = 'Administrador') {
  vi.mocked(authApi.me).mockResolvedValue(identity(role));
  return render(<MemoryRouter initialEntries={['/pedidos/nuevo']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
}
async function fill() {
  await screen.findByRole('form', { name: 'Registrar pedido' });
  for (const [label, value] of [[labels.nombre, 'Cliente prueba'], [labels.direccion, 'Destino prueba'], [labels.peso, '2.5'], [labels.volumen, '0.015'], [labels.fechaInicio, '2026-10-02'], [labels.inicio, '09:00'], [labels.fechaFin, '2026-10-02'], [labels.fin, '11:00']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  await userEvent.click(screen.getByRole('button', { name: 'Seleccionar destino de prueba' }));
  await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'ESTANDAR'); await userEvent.selectOptions(screen.getByLabelText('Tipo de producto'), 'NO_PERECEDERO');
}
beforeEach(() => { vi.resetAllMocks(); vi.mocked(geocoding.search).mockResolvedValue([]); vi.mocked(geocoding.reverse).mockRejectedValue(new Error('offline')); vi.mocked(authApi.logout).mockResolvedValue(undefined); vi.mocked(ordersApi.create).mockResolvedValue(result); });
describe('US-004 Registrar pedido', () => {
  it('busca con debounce, selecciona coordenadas y exige reconfirmar tras editar', async () => {
    setup(); await fill();
    vi.mocked(geocoding.search).mockResolvedValue([{ address: 'Av. Giráldez, Huancayo', latitud: -12.07, longitud: -75.21 }]);
    fireEvent.change(screen.getByLabelText(labels.direccion), { target: { value: 'Av. Giráldez' } });
    expect(geocoding.search).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole('button', { name: 'Av. Giráldez, Huancayo' }));
    expect(screen.getByText('Ubicación confirmada.')).toBeVisible();
    fireEvent.change(screen.getByLabelText(labels.direccion), { target: { value: 'Otra calle' } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(ordersApi.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(labels.direccion), { target: { value: 'Av. Giráldez' } });
    await userEvent.click(await screen.findByRole('button', { name: 'Av. Giráldez, Huancayo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(ordersApi.create).toHaveBeenCalledWith(expect.objectContaining({ cliente: expect.objectContaining({ latitud: -12.07, longitud: -75.21, direccion: 'Av. Giráldez, Huancayo' }) }));
  });
  it('selección manual consulta dirección inversa y conserva datos ante fallo', async () => {
    setup(); await fill();
    expect(geocoding.reverse).toHaveBeenCalledWith({ latitud: -12.065, longitud: -75.204 }, expect.any(AbortSignal));
    expect(await screen.findByText(/No se pudo obtener la dirección/)).toBeVisible();
    expect(screen.getByLabelText(labels.direccion)).toHaveValue('Destino prueba');
    vi.mocked(geocoding.reverse).mockResolvedValue('Calle nueva, Huancayo');
    await userEvent.click(screen.getByRole('button', { name: 'Seleccionar destino de prueba' }));
    await waitFor(() => expect(screen.getByLabelText(labels.direccion)).toHaveValue('Calle nueva, Huancayo'));
  });
  it('fecha inicio limpia un fin anterior y aplica min', async () => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.fechaInicio), { target: { value: '2026-10-03' } });
    expect(screen.getByLabelText(labels.fechaFin)).toHaveValue('');
    expect(screen.getByLabelText(labels.fechaFin)).toHaveAttribute('min', '2026-10-03');
  });
  it.each(['32', '13', '25:00', '12:75', 'texto'])('rechaza hora escrita inválida %s', async value => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.inicio), { target: { value } });
    expect(screen.getByLabelText(labels.inicio)).toHaveValue('09:00');
    expect(ordersApi.create).not.toHaveBeenCalled(); expect(screen.getByLabelText(labels.inicio)).toHaveAttribute('aria-invalid', 'true');
  });
  it('acepta cierre a las 8 PM y apertura al día siguiente', async () => {
    setup(); await fill();
    fireEvent.change(screen.getByLabelText(labels.inicio), { target: { value: '07:00' } });
    await userEvent.selectOptions(screen.getByLabelText('AM/PM de inicio'), 'PM');
    fireEvent.change(screen.getByLabelText(labels.fechaFin), { target: { value: '2026-10-03' } });
    fireEvent.change(screen.getByLabelText(labels.fin), { target: { value: '07:00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(ordersApi.create).toHaveBeenCalledWith(expect.objectContaining({ ventana_inicio: '2026-10-02T19:00:00-05:00', ventana_fin: '2026-10-03T07:00:00-05:00' }));
  });
  it.each(['01:30', '08:30'])('rechaza %s PM fuera de atención', async time => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.fin), { target: { value: time } });
    await userEvent.selectOptions(screen.getByLabelText('AM/PM de fin'), 'PM');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(ordersApi.create).not.toHaveBeenCalled(); expect(screen.getByText(/Hora de fin fuera de atención/)).toBeVisible();
  });
  it('convierte 12 PM y permite terminar el turno a la 1 PM', async () => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.inicio), { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText(labels.fin), { target: { value: '01:00' } });
    await userEvent.selectOptions(screen.getByLabelText('AM/PM de inicio'), 'PM');
    await userEvent.selectOptions(screen.getByLabelText('AM/PM de fin'), 'PM');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(ordersApi.create).toHaveBeenCalledWith(expect.objectContaining({ ventana_inicio: '2026-10-02T12:00:00-05:00', ventana_fin: '2026-10-02T13:00:00-05:00' }));
  });
  it('combina fecha y hora como Lima sin convertir 09:00 en otra hora local', async () => {
    setup(); await fill();
    expect(screen.getByLabelText(labels.fechaInicio)).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText(labels.inicio)).toHaveAttribute('type', 'text');
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    const payload = vi.mocked(ordersApi.create).mock.calls[0][0];
    expect(payload.ventana_inicio).toBe('2026-10-02T09:00:00-05:00');
    expect(payload.ventana_fin).toBe('2026-10-02T11:00:00-05:00');
    expect(new Date(payload.ventana_inicio).toISOString()).toBe('2026-10-02T14:00:00.000Z');
  });
  it.each([[labels.fechaInicio, 'fecha de inicio'], [labels.inicio, 'hora de inicio'], [labels.fechaFin, 'fecha de fin'], [labels.fin, 'hora de fin']])('rechaza %s incompleto y enfoca su input', async (label, message) => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(label), { target: { value: '' } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(screen.getByText(`Selecciona una ${message} válida.`)).toBeVisible();
    expect(screen.getByLabelText(label)).toHaveFocus(); expect(ordersApi.create).not.toHaveBeenCalled();
  });
  it.each(['09:00', '08:59'])('rechaza fin igual/anterior %s y permite corregirlo', async time => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.fin), { target: { value: time } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(screen.getByText('El fin de la ventana de entrega debe ser posterior al inicio.')).toBeVisible();
    expect(ordersApi.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(labels.fin), { target: { value: '11:00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' })); expect(ordersApi.create).toHaveBeenCalledTimes(1);
  });
  it('compara también fechas: acepta la entrega al día siguiente y rechaza el día anterior', async () => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.fechaFin), { target: { value: '2026-10-01' } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' })); expect(ordersApi.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(labels.fechaFin), { target: { value: '2026-10-03' } });
    fireEvent.change(screen.getByLabelText(labels.fin), { target: { value: '07:30' } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(ordersApi.create).toHaveBeenCalledWith(expect.objectContaining({ ventana_fin: '2026-10-03T07:30:00-05:00' }));
  });
  it('volumen vacío se envía como null y conserva descripción/referencia', async () => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.volumen), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Descripción de carga'), { target: { value: 'Costal de ropa' } });
    fireEvent.change(screen.getByLabelText('Referencia (opcional)'), { target: { value: 'Puerta azul' } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(ordersApi.create).toHaveBeenCalledWith(expect.objectContaining({ volumen_m3: null, descripcion_carga: 'Costal de ropa', cliente: expect.objectContaining({ referencia: 'Puerta azul' }) }));
  });
  it('sin ubicación seleccionada no registra ni usa el centro inicial como destino', async () => {
    setup(); await fill();
    // Remount a fresh form and fill every field except the map selection.
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    await screen.findByText('Pedido registrado correctamente');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar otro pedido' }));
    vi.mocked(ordersApi.create).mockClear();
    for (const [label, value] of [[labels.nombre, 'Cliente'], [labels.direccion, 'Destino'], [labels.peso, '2'], [labels.fechaInicio, '2026-10-02'], [labels.inicio, '09:00'], [labels.fechaFin, '2026-10-02'], [labels.fin, '11:00']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'ESTANDAR'); await userEvent.selectOptions(screen.getByLabelText('Tipo de producto'), 'NO_PERECEDERO');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(screen.getByText('Selecciona un punto de entrega válido en el mapa.')).toBeVisible(); expect(ordersApi.create).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Latitud')).not.toBeInTheDocument(); expect(screen.queryByLabelText('Longitud')).not.toBeInTheDocument();
  });
  it.each(['0', '-1'])('rechaza volumen %s sin llamar a la API', async value => {
    setup(); await fill(); fireEvent.change(screen.getByLabelText(labels.volumen), { target: { value } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' })); expect(ordersApi.create).not.toHaveBeenCalled();
  });
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
    for (const [label, value] of [[labels.peso, '0'], [labels.volumen, '0.0001'], [labels.fin, '08:00']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));
    expect(screen.getByText('El fin de la ventana de entrega debe ser posterior al inicio.')).toBeVisible(); expect(ordersApi.create).not.toHaveBeenCalled();
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
