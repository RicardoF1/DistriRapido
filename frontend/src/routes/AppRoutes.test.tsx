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
  beforeEach(() => { vi.resetAllMocks(); vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, expiresAt: Date.now() + 900000 }); });
  it('protege acceso directo sin sesión', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('missing', 401));
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it.each([
    ['Administrador', '/acceso/administrador'], ['Operador / Técnico', '/acceso/operador'],
    ['Usuario Final / Conductor', '/acceso/conductor'], ['Auditor Externo', '/acceso/auditor'],
  ])('redirige %s y verifica identidad con API', async (role, path) => {
    expect(accessPath(role)).toBe(path); renderRoutes('/login', role);
    expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
    expect(authApi.me).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
  it('corrige destino ajeno al rol', async () => {
    renderRoutes('/acceso/conductor'); expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
  });
  it('tiene destino seguro para rol desconocido', () => { expect(accessPath('unknown')).toBe('/acceso/sin-permiso'); });
  it('permite reintentar un fallo de red', async () => {
    vi.mocked(authApi.me).mockRejectedValueOnce(new ApiError('network', 0)).mockResolvedValue({ ...loginResponse.user, expiresAt: Date.now() + 900000 });
    renderRoutes('/acceso/administrador'); expect(await screen.findByRole('alert')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' })); expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
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
    await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ })); expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
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
    expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
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
    expect(screen.queryByText('Acceso permitido')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
  });
  it('logout correcto limpia sesión y redirige; fallo de red no finge éxito', async () => {
    vi.mocked(authApi.logout).mockRejectedValueOnce(new ApiError('network', 0)).mockResolvedValue(undefined);
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Acceso permitido' });
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cerrar la sesión');
    expect(screen.getByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('muestra estado de carga durante logout', async () => {
    let resolve!: () => void;
    vi.mocked(authApi.logout).mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Acceso permitido' });
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.getByRole('button', { name: /Cerrando sesión/ })).toBeDisabled();
    await act(async () => resolve());
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('recomprueba cookie al enfocar y no conserva sesión cerrada en otra pestaña', async () => {
    render(<MemoryRouter initialEntries={['/acceso/administrador']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Acceso permitido' });
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('missing', 401));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('detecta uso del hook fuera del proveedor', () => {
    function Probe() { useAuth(); return null; }
    expect(() => render(<Probe />)).toThrow('useAuth requiere AuthProvider.');
  });
});
