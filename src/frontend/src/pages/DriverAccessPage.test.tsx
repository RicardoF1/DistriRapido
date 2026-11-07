import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../routes/AppRoutes';
import { ApiError, authApi } from '../services/api';
import { driverProfileApi, type DriverRouteSummary } from '../services/driver-profile-api';
const auth = vi.hoisted(() => ({ session: { user: { usuario_id: 'account', email: 'driver@test', rol: { rol_id: 'role', nombre: 'Usuario Final / Conductor' } }, expiresAt: Date.now() + 900000 }, restoring: false, restoreError: '', acceptSession: vi.fn(), logout: vi.fn() }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('../services/api', async () => ({ ...await vi.importActual<typeof import('../services/api')>('../services/api'), authApi: { me: vi.fn() } }));
vi.mock('../services/driver-profile-api', () => ({ driverProfileApi: { me: vi.fn(), routes: vi.fn(), route: vi.fn(), updateDelivery: vi.fn() } }));
const profile = { conductor_id: 'driver', nombre_completo: 'Conductor de prueba', estado: 'ACTIVO' };
const summary = { ruta_id: 'route', estado: 'ASIGNADA' as const, asignado_en: '2030-01-01T12:00:00Z', iniciado_en: null, current_version: 1, version: { ruta_version_id: 'v', numero: 1, distancia_m: '1000', duracion_s: '600', resultado: {}, vehiculo: { vehiculo_id: 'veh', placa: 'ABC-123', tipo: 'VAN' } }, progress: { total: 1, processed: 0, percentage: 0 } };
const detail = { ...summary, finalizado_en: null, version: { ...summary.version!, paradas: [{ parada_id: 'stop', pedido_id: 'order', secuencia: 1, datos: { direccion: 'Destino de prueba' }, estado_entrega: 'PENDIENTE' as const, causa_no_entrega: null, atendido_en: null, actualizado_en: '2030-01-01T12:00:00Z', version_entrega: 0 }] } };
function open() { return render(<MemoryRouter initialEntries={['/acceso/conductor']}><AppRoutes /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(authApi.me).mockResolvedValue({ ...auth.session.user, expiresAt: Date.now() + 900000 }); vi.mocked(driverProfileApi.me).mockResolvedValue(profile); vi.mocked(driverProfileApi.routes).mockResolvedValue([summary]); vi.mocked(driverProfileApi.route).mockResolvedValue(detail); vi.mocked(driverProfileApi.updateDelivery).mockResolvedValue({ delivery: { ...detail.version.paradas[0], estado_entrega: 'ENTREGADA', version_entrega: 1 }, route: { ruta_id: 'route', estado: 'COMPLETADA' }, progress: { total: 1, processed: 1, delivered: 1, not_delivered: 0, percentage: 100 } }); });
it('muestra rutas reales y detalle de entregas propias', async () => { open(); expect(await screen.findByText('ABC-123')).toBeVisible(); await userEvent.click(screen.getByRole('button', { name: 'Ver entregas' })); expect(await screen.findByText(/Destino de prueba/)).toBeVisible(); expect(driverProfileApi.routes).toHaveBeenCalled(); expect(driverProfileApi.route).toHaveBeenCalledWith('route'); });
it('actualiza una entrega usando la versión visible y refresca la ruta', async () => { open(); await userEvent.click(await screen.findByRole('button', { name: 'Ver entregas' })); await userEvent.click(await screen.findByRole('button', { name: 'Marcar entregada' })); await waitFor(() => expect(driverProfileApi.updateDelivery).toHaveBeenCalledWith('stop', { estado: 'ENTREGADA', expected_version: 0 })); expect(await screen.findByRole('status')).toHaveTextContent('Estado de entrega actualizado correctamente.'); });
it('exige causa antes de registrar no entregada', async () => { open(); await userEvent.click(await screen.findByRole('button', { name: 'Ver entregas' })); await userEvent.click(await screen.findByRole('button', { name: 'Registrar no entregada' })); expect(await screen.findByRole('alert')).toHaveTextContent('Escribe la causa'); expect(driverProfileApi.updateDelivery).not.toHaveBeenCalled(); });
it('muestra estado vacío sin inventar rutas', async () => { vi.mocked(driverProfileApi.routes).mockResolvedValue([]); open(); expect(await screen.findByText('No tienes rutas asignadas.')).toBeVisible(); });
it('muestra el rechazo real del backend, mantiene la entrega PENDIENTE y no reintenta', async () => {
  const message = 'El pedido debe estar EN_RUTA antes de registrarse como entregado.';
  vi.mocked(driverProfileApi.updateDelivery).mockRejectedValue(new ApiError(message, 409));
  open();
  await userEvent.click(await screen.findByRole('button', { name: 'Ver entregas' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Marcar entregada' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.queryByText('Ya existe un usuario con ese correo electrónico.')).not.toBeInTheDocument();
  expect(screen.getByText(/Estado: PENDIENTE/)).toBeVisible();
  expect(screen.getByText('Progreso: 0/1 (0%)')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Marcar entregada' })).toBeEnabled();
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(driverProfileApi.updateDelivery).toHaveBeenCalledTimes(1);
  expect(driverProfileApi.route).toHaveBeenCalledTimes(1);
  expect(auth.acceptSession).not.toHaveBeenCalled();
});
const sections = [['Mi cuenta', 'mi-cuenta'], ['Mi jornada', 'mi-jornada'], ['Mis rutas', 'mis-rutas'], ['Mis entregas', 'mis-entregas']] as const;
const scrollIntoView = vi.fn();
beforeAll(() => { Element.prototype.scrollIntoView = scrollIntoView; });
beforeEach(() => { window.history.replaceState(null, '', '/'); });
async function openLoaded() { open(); expect(await screen.findByText('ABC-123')).toBeVisible(); return within(screen.getByRole('navigation', { name: 'Área del conductor' })); }
const section = (id: string) => document.getElementById(id)!;
function expectRevealed(id: string) {
  expect(window.location.hash).toBe('#' + id);
  expect(section(id)).toHaveFocus();
  expect(scrollIntoView.mock.contexts.at(-1)).toBe(section(id));
  expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'start' });
}
it.each(sections)('%s actualiza el hash, desplaza y enfoca la sección', async (name, id) => {
  const nav = await openLoaded();
  await userEvent.click(nav.getByRole('link', { name }));
  await waitFor(() => expectRevealed(id));
  expect(section(id)).toHaveAttribute('tabindex', '-1');
  expect(section(id)).toHaveAccessibleName(name);
  expect(nav.getByRole('link', { name })).toHaveAttribute('aria-current', 'location');
  expect(nav.getAllByRole('link').filter(link => link.getAttribute('aria-current') === 'location')).toHaveLength(1);
});
it.each(sections)('Enter en %s navega y enfoca la sección', async (name, id) => {
  const nav = await openLoaded();
  nav.getByRole('link', { name }).focus();
  await userEvent.keyboard('{Enter}');
  await waitFor(() => expectRevealed(id));
});
it('al recargar con hash enfoca la sección correcta cuando terminan de cargar las rutas', async () => {
  window.history.replaceState(null, '', '/acceso/conductor#mis-entregas');
  await openLoaded();
  await waitFor(() => expectRevealed('mis-entregas'));
  expect(scrollIntoView).toHaveBeenCalledTimes(1);
});
it('Atrás y Adelante vuelven a enfocar la sección sin repetir solicitudes', async () => {
  const nav = await openLoaded();
  await userEvent.click(nav.getByRole('link', { name: 'Mi cuenta' }));
  await waitFor(() => expectRevealed('mi-cuenta'));
  await userEvent.click(nav.getByRole('link', { name: 'Mis rutas' }));
  await waitFor(() => expectRevealed('mis-rutas'));
  window.history.back();
  await waitFor(() => expectRevealed('mi-cuenta'));
  window.history.forward();
  await waitFor(() => expectRevealed('mis-rutas'));
  await userEvent.click(nav.getByRole('link', { name: 'Mis rutas' }));
  await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(5));
  expect(section('mis-rutas')).toHaveFocus();
  expect(driverProfileApi.me).toHaveBeenCalledTimes(1);
  expect(driverProfileApi.routes).toHaveBeenCalledTimes(1);
  expect(driverProfileApi.route).not.toHaveBeenCalled();
});
it('muestra los textos del panel en UTF-8', async () => {
  await openLoaded();
  expect(screen.getByText('EcoRuta Huancayo · Mi espacio')).toBeVisible();
  expect(screen.getByText('✓')).toBeVisible();
  expect(screen.getByText(/· ASIGNADA/)).toBeVisible();
  expect(screen.getByText(/1\.00 km · 10\.0 min/)).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Ver entregas' }));
  expect(await screen.findByText('Ruta ASIGNADA · ABC-123 · Inicio: No iniciado')).toBeVisible();
  expect(screen.getByText(/· Destino de prueba/)).toBeVisible();
  expect(document.body.textContent).not.toMatch(/[ÃÂ]|â[€œ]/);
});
it('muestra Vehículo no disponible y los estados de carga con puntos suspensivos correctos', async () => {
  let verify!: (value: typeof profile) => void;
  let release!: (value: DriverRouteSummary[]) => void;
  vi.mocked(driverProfileApi.me).mockReturnValue(new Promise(done => { verify = done; }));
  vi.mocked(driverProfileApi.routes).mockReturnValue(new Promise(done => { release = done; }));
  open();
  const checking = await screen.findByText('Comprobando tu identidad de conductor…');
  expect(checking.tagName).toBe('OUTPUT');
  expect(screen.getByRole('status')).toBe(checking);
  verify(profile);
  const loading = await screen.findByText('Cargando rutas asignadas…');
  expect(loading).toBeVisible();
  expect(loading.tagName).toBe('OUTPUT');
  expect(screen.getByRole('status')).toBe(loading);
  release([{ ...summary, version: null }]);
  expect(await screen.findByText('Vehículo no disponible')).toBeVisible();
  expect(document.body.textContent).not.toMatch(/[ÃÂ]|â[€œ]/);
});
it('desactiva la restauración automática del desplazamiento solo mientras el panel está montado', async () => {
  window.history.scrollRestoration = 'auto';
  const view = open();
  expect(await screen.findByText('ABC-123')).toBeVisible();
  expect(window.history.scrollRestoration).toBe('manual');
  view.unmount();
  expect(window.history.scrollRestoration).toBe('auto');
});
