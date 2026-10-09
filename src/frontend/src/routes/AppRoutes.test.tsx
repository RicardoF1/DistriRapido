import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from './AppRoutes';
import { AuthProvider } from '../features/auth/AuthProvider';
import { AuthContext } from '../features/auth/auth-context';
import { useAuth } from '../hooks/useAuth';
import { authApi, ApiError } from '../services/api';
import { loginResponse } from '../test/fixtures';
import { accessPath } from './role-access';
import { adminApi } from '../services/admin-api';
vi.mock('../services/admin-api', () => ({ adminApi: { summary: vi.fn().mockResolvedValue({ totalOrders: 0, pendingOrders: 0, totalUsers: 0, ordersByState: [] }) } }));
vi.mock('../services/api', async () => {
  const actual = await vi.importActual<typeof import('../services/api')>('../services/api');
  return { ...actual, authApi: { login: vi.fn(), me: vi.fn(), logout: vi.fn() } };
});
function renderRoutes(path = '/login', role = 'Administrador') {
  const acceptSession = vi.fn();
  const session = { expiresAt: Date.now() + 900000, user: { ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role } } };
  render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ session, acceptSession, restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><AppRoutes /></AuthContext.Provider></MemoryRouter>);
  return { acceptSession };
}
describe('Acceso según rol', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.mocked(adminApi.summary).mockResolvedValue({ totalOrders: 0, pendingOrders: 0, totalUsers: 0, ordersByState: [] }); vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, expiresAt: Date.now() + 900000 }); });
  it('protege acceso directo sin sesión', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('missing', 401));
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it.each([
    ['Administrador', '/acceso/administrador'], ['Operador / Técnico', '/acceso/operador'],
    ['Usuario Final / Conductor', '/acceso/conductor'], ['Auditor Externo', '/acceso/auditor'],
  ])('redirige %s y verifica identidad con API', async (role, path) => {
    expect(accessPath(role)).toBe(path); vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role }, expiresAt: Date.now() + 900000 }); renderRoutes('/login', role);
    expect(await screen.findByRole('heading', { name: role === 'Administrador' ? 'Panel de administración' : 'Acceso permitido' })).toBeVisible();
    expect(authApi.me).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
  it('corrige destino ajeno al rol', async () => {
    renderRoutes('/acceso/conductor'); expect(await screen.findByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  });
  it('panel administrativo ofrece tres tarjetas sin duplicar la identidad del encabezado', async () => {
    renderRoutes('/acceso/administrador');
    await screen.findByRole('heading', { name: 'Panel de administración' });
    const shortcuts = screen.getByRole('navigation', { name: 'Accesos rápidos' });
    expect(shortcuts.querySelectorAll('a')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Usuarios y roles' })).toHaveAttribute('href', '/usuarios');
    expect(shortcuts.querySelector('a[href="/pedidos/nuevo"]')).toHaveAccessibleName('Registrar pedido');
    expect(shortcuts.querySelector('a[href="/pedidos"]')).toHaveAccessibleName('Consultar pedidos');
    expect(screen.queryByText('Cuenta')).not.toBeInTheDocument();
    expect(screen.queryByText('Rol')).not.toBeInTheDocument();
    expect(screen.getAllByText(loginResponse.user.email)).toHaveLength(1);
    expect(authApi.me).toHaveBeenCalledTimes(1);
  });
  it('el panel monta el resumen obtenido de la API antes de los accesos rápidos', async () => {
    vi.mocked(adminApi.summary).mockResolvedValue({totalOrders:123,pendingOrders:20,totalUsers:4,ordersByState:[{state:'PENDIENTE',count:20},{state:'OTRO_ESTADO_EXISTENTE',count:103}]});
    renderRoutes('/acceso/administrador');
    await screen.findByText('Pedidos por estado');
    expect(screen.getByText('Pedidos registrados').parentElement).toHaveTextContent('123');
    expect(screen.getByText('Pedidos pendientes').parentElement).toHaveTextContent('20');
    expect(screen.getByRole('navigation',{name:'Accesos rápidos'}).querySelectorAll('a')).toHaveLength(3);
    expect(adminApi.summary).toHaveBeenCalledTimes(1);
  });
  it('no muestra tarjetas administrativas si la respuesta de identidad difiere del rol vigente', async () => {
    renderRoutes('/acceso/operador', 'Operador / Técnico');
    await screen.findByRole('heading', { name: 'Acceso permitido' });
    expect(screen.queryByRole('navigation', { name: 'Accesos rápidos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios y roles' })).not.toBeInTheDocument();
  });
  it.each(['Operador / Técnico', 'Usuario Final / Conductor', 'Auditor Externo'])('conserva pantalla y opciones de %s sin panel administrativo', async role => {
    vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role }, expiresAt: Date.now() + 900000 });
    renderRoutes('/acceso/administrador', role);
    await screen.findByRole('heading', { name: 'Acceso permitido' });
    expect(screen.queryByRole('heading', { name: 'Panel de administración' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios y roles' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Accesos rápidos' })).not.toBeInTheDocument();
    expect(screen.getByText('Cuenta')).toBeVisible();
  });
  it('tiene destino seguro para rol desconocido', () => { expect(accessPath('unknown')).toBe('/acceso/sin-permiso'); });
  it('permite reintentar un fallo de red', async () => {
    vi.mocked(authApi.me).mockRejectedValueOnce(new ApiError('network', 0)).mockResolvedValue({ ...loginResponse.user, expiresAt: Date.now() + 900000 });
    renderRoutes('/acceso/administrador'); expect(await screen.findByRole('alert')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' })); expect(await screen.findByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  });
  it('descarta sesión rechazada por el servidor', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('expired', 401));
    const { acceptSession } = renderRoutes('/acceso/administrador'); await waitFor(() => expect(acceptSession).toHaveBeenCalledWith(null));
  });
  it('procesa login exitoso y redirección', async () => {
    vi.mocked(authApi.login).mockResolvedValue(loginResponse);
    vi.mocked(authApi.me).mockRejectedValueOnce(new ApiError('missing', 401));
    render(<MemoryRouter><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'test@example.com'); await userEvent.type(screen.getByLabelText('Contraseña'), 'input');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ })); expect(await screen.findByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  });
  it('expira la sesión local sin renovar caducidad', async () => {
    vi.useFakeTimers();
    function Probe() {
      const { session, acceptSession } = useAuth();
      return <button onClick={() => acceptSession({ ...loginResponse, expiresIn: 1 })}>{session ? 'activa' : 'vacía'}</button>;
    }
    render(<AuthProvider><Probe /></AuthProvider>);
    await act(async () => {});
    act(() => screen.getByRole('button').click()); expect(screen.getByText('activa')).toBeVisible();
    act(() => vi.advanceTimersByTime(1001)); expect(screen.getByText('vacía')).toBeVisible(); vi.useRealTimers();
  });
  it('restaura sesión vigente después de montar nuevamente la aplicación', async () => {
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Comprobando sesión…' })).toBeVisible();
    expect(await screen.findByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  });
  it('no admite una sesión restaurada que ya expiró', async () => {
    vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, expiresAt: Date.now() - 1 });
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('bloquea acceso durante fallo de restauración y permite reintentar', async () => {
    vi.mocked(authApi.me).mockRejectedValueOnce(new ApiError('network', 0));
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo comprobar la sesión');
    expect(screen.queryByText('Panel de administración')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  });
  it('logout correcto limpia sesión y redirige; fallo de red no finge éxito', async () => {
    vi.mocked(authApi.logout).mockRejectedValueOnce(new ApiError('network', 0)).mockResolvedValue(undefined);
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Panel de administración' });
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cerrar la sesión');
    expect(screen.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('muestra estado de carga durante logout', async () => {
    let resolve!: () => void;
    vi.mocked(authApi.logout).mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Panel de administración' });
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.getByRole('button', { name: /Cerrando sesión/ })).toBeDisabled();
    await act(async () => resolve());
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('recomprueba cookie al enfocar y no conserva sesión cerrada en otra pestaña', async () => {
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Panel de administración' });
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('missing', 401));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('detecta uso del hook fuera del proveedor', () => {
    function Probe() { useAuth(); return null; }
    expect(() => render(<Probe />)).toThrow('useAuth requiere AuthProvider.');
  });
});
