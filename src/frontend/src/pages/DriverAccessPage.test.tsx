import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../routes/AppRoutes';
import { authApi } from '../services/api';
const auth = vi.hoisted(() => ({ session: { user: { usuario_id: 'account-fixture', email: 'driver@example.test', rol: { rol_id: 'role-fixture', nombre: 'Usuario Final / Conductor' } }, expiresAt: Date.now() + 900000 }, restoring: false, restoreError: '', acceptSession: vi.fn(), logout: vi.fn() }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('../services/api', async () => ({ ...await vi.importActual<typeof import('../services/api')>('../services/api'), authApi: { me: vi.fn() } }));
const profile = { conductor_id: 'driver-fixture', nombre_completo: 'Conductor de prueba', estado: 'ACTIVO' };
const load = vi.fn();
const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
function open() { return render(<MemoryRouter initialEntries={['/acceso/conductor']}><AppRoutes /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', load); load.mockResolvedValue(reply(200, profile)); vi.mocked(authApi.me).mockResolvedValue({ ...auth.session.user, expiresAt: Date.now() + 900000 }); });
afterEach(() => vi.unstubAllGlobals());
it('muestra identidad propia y funciones pendientes sin inventar rutas ni disponibilidad', async () => {
  open(); await screen.findByText('Conductor de prueba');
  expect(screen.getByRole('heading', { name: 'Panel del conductor' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Mi jornada' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Mis rutas' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Mis entregas' })).toBeVisible();
  expect(screen.getByText('La consulta de rutas estará disponible cuando se implemente el módulo de asignaciones')).toBeVisible();
  expect(screen.queryByText(/No tienes rutas asignadas/)).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Actualizar estado/ })).not.toBeInTheDocument();
  expect(load).toHaveBeenCalledWith('http://localhost:3000/driver/me', expect.objectContaining({ credentials: 'include', cache: 'no-store' }));
});
it.each(['Tu cuenta no tiene un conductor vinculado. Contacta al administrador.', 'Tu ficha de conductor está inactiva. Contacta al administrador.'])('distingue bloqueo operativo: %s', async message => {
  load.mockResolvedValue(reply(403, { message })); open();
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.queryByRole('heading', { name: 'Mis rutas' })).not.toBeInTheDocument();
});
it('muestra carga y recupera un error de servidor sin simular una lista vacía', async () => {
  let resolve!: (value: ReturnType<typeof reply>) => void;
  load.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  open(); expect(screen.getByText('Comprobando tu identidad de conductor…')).toBeVisible();
  resolve(reply(503, {})); expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo/);
  expect(screen.queryByText(/No tienes rutas asignadas/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar' })); await screen.findByText('Conductor de prueba');
});
it('distingue red y sesión expirada', async () => {
  load.mockRejectedValueOnce(new TypeError('offline')); const view = open();
  expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo conectar/); view.unmount();
  load.mockResolvedValue(reply(401, {})); open();
  await waitFor(() => expect(auth.acceptSession).toHaveBeenCalledWith(null));
});
