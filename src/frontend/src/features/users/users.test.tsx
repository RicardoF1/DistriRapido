import { act, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { AppRoutes } from '../../routes/AppRoutes';
import { usersApi } from '../../services/users-api';
import { authApi, ApiError } from '../../services/api';
import { loginResponse } from '../../test/fixtures';
import type { RoleOption, UserAccount } from '../../types/users';
vi.mock('../../services/users-api', () => ({ usersApi: { list: vi.fn(), get: vi.fn(), roles: vi.fn(), create: vi.fn(), update: vi.fn() } }));
vi.mock('../../services/api', async () => ({ ...await vi.importActual<typeof import('../../services/api')>('../../services/api'), authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() } }));
const roles: RoleOption[] = [{ rol_id: 'admin', nombre: 'Administrador', descripcion: 'Administrador' }, { rol_id: 'audit', nombre: 'Auditor Externo', descripcion: 'Auditor' }];
const account: UserAccount = { usuario_id: 'user-id', email: 'account@example.com', rol_id: 'admin', rol: roles[0], estado: 'ACTIVO', creado_en: new Date().toISOString() };
function setup(path = '/usuarios') { return render(<MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>); }
beforeEach(() => {
  vi.resetAllMocks(); vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, expiresAt: Date.now() + 900000 });
  vi.mocked(usersApi.list).mockResolvedValue([account]); vi.mocked(usersApi.roles).mockResolvedValue(roles); vi.mocked(usersApi.get).mockResolvedValue(account);
});
describe('US-003 interfaz', () => {
  it('Administrador navega desde Usuarios a Registrar pedido mediante el menú común', async () => {
    setup('/usuarios'); await screen.findByRole('table');
    const navigation = screen.getByRole('navigation', { name: 'Administración' });
    expect(within(navigation).getByRole('link', { name: 'Acceso' })).toBeVisible();
    expect(within(navigation).getByRole('link', { name: 'Usuarios' })).toBeVisible();
    const link = within(navigation).getByRole('link', { name: 'Registrar pedido' });
    expect(link).toHaveAttribute('href', '/pedidos/nuevo');
    await userEvent.click(link);
    expect(await screen.findByRole('form', { name: 'Registrar pedido' })).toBeVisible();
    expect(screen.getByLabelText('Nombre del cliente')).toBeVisible();
    expect(screen.getByLabelText('Tipo de producto')).toBeVisible();
  });
  it.each(['/usuarios/nuevo', '/usuarios/user-id/editar'])('conserva borrador en memoria durante foco y visibilidad en %s', async (path) => {
    setup(path);
    const email = await screen.findByLabelText('Correo electrónico');
    await userEvent.clear(email); await userEvent.type(email, 'draft@example.com');
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'audit');
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'BLOQUEADO');
    if (path.endsWith('/nuevo')) await userEvent.type(screen.getByLabelText('Contraseña'), 'partial-secret');
    for (const event of ['focus', 'visibilitychange']) {
      let resolve!: (identity: Awaited<ReturnType<typeof authApi.me>>) => void;
      vi.mocked(authApi.me).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
      const calls = vi.mocked(authApi.me).mock.calls.length;
      await act(async () => {
        if (event === 'focus') window.dispatchEvent(new Event(event));
        else document.dispatchEvent(new Event(event));
      });
      await waitFor(() => expect(authApi.me).toHaveBeenCalledTimes(calls + 1));
      expect(screen.getByLabelText('Correo electrónico')).toBe(email);
      expect(email).toHaveValue('draft@example.com');
      await act(async () => resolve({ ...loginResponse.user, expiresAt: Date.now() + 900000 }));
      expect(screen.getByLabelText('Correo electrónico')).toBe(email);
      expect(screen.getByLabelText('Rol')).toHaveValue('audit');
      expect(screen.getByLabelText('Estado')).toHaveValue('BLOQUEADO');
      if (path.endsWith('/nuevo')) expect(screen.getByLabelText('Contraseña')).toHaveValue('partial-secret');
    }
    expect(usersApi.roles).toHaveBeenCalledTimes(1);
    expect(usersApi.get).toHaveBeenCalledTimes(path.endsWith('/nuevo') ? 0 : 1);
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });
  it.each([401, 403])('revalidación rechazada HTTP %s retira el formulario protegido', async (status) => {
    setup('/usuarios/nuevo'); await screen.findByLabelText('Correo electrónico');
    vi.mocked(authApi.me).mockRejectedValueOnce(new ApiError('Sesión rechazada', status));
    await act(async () => window.dispatchEvent(new Event('focus')));
    if (status === 401) expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
    else expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo comprobar la sesión');
    expect(screen.queryByRole('form', { name: 'Crear usuario' })).not.toBeInTheDocument();
  });
  it('revalidación con rol cambiado retira el formulario administrativo', async () => {
    setup('/usuarios/nuevo'); await screen.findByLabelText('Correo electrónico');
    vi.mocked(authApi.me).mockResolvedValueOnce({ ...loginResponse.user, rol: { rol_id: 'operator', nombre: 'Operador / Técnico' }, expiresAt: Date.now() + 900000 });
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible();
    expect(screen.queryByRole('form', { name: 'Crear usuario' })).not.toBeInTheDocument();
  });
  it('logout retira el borrador y su contraseña de la interfaz', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    setup('/usuarios/nuevo'); await screen.findByLabelText('Correo electrónico');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'partial-secret');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
    expect(screen.queryByRole('form', { name: 'Crear usuario' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });
  it('/usuarios/nuevo carga roles sin consultar un usuario con id nuevo', async () => {
    setup('/usuarios/nuevo');
    expect(await screen.findByRole('form', { name: 'Crear usuario' })).toBeVisible();
    expect(usersApi.roles).toHaveBeenCalled();
    expect(usersApi.get).not.toHaveBeenCalled();
    expect(usersApi.list).not.toHaveBeenCalled();
  });
  it('listado muestra email, rol, estado y navegación', async () => {
    setup(); expect(await screen.findByRole('cell', { name: account.email })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Administrador' })).toBeVisible(); expect(screen.getByText('Activo')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  });
  it('muestra carga y estado vacío', async () => {
    let resolve!: (items: UserAccount[]) => void;
    vi.mocked(usersApi.list).mockReturnValue(new Promise((done) => { resolve = done; })); setup();
    expect(await screen.findByText('Cargando usuarios…')).toBeVisible();
    await act(async () => resolve([])); expect(screen.getByText('No hay usuarios registrados.')).toBeVisible();
  });
  it.each([new Error('Falló consulta'), 'unexpected'])('muestra error y reintenta consulta: %s', async (cause) => {
    vi.mocked(usersApi.list).mockRejectedValueOnce(cause); setup();
    expect(await screen.findByRole('alert')).toBeVisible(); await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('cell', { name: account.email })).toBeVisible();
  });
  it('sesión rechazada por API vuelve a login', async () => {
    vi.mocked(usersApi.list).mockRejectedValue(new ApiError('expired', 401)); setup();
    expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('rol no autorizado no alcanza usuarios', async () => {
    vi.mocked(authApi.me).mockResolvedValue({ ...loginResponse.user, rol: { rol_id: 'operator', nombre: 'Operador / Técnico' }, expiresAt: Date.now() + 900000 }); setup();
    expect(await screen.findByRole('heading', { name: 'Acceso permitido' })).toBeVisible(); expect(usersApi.list).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Usuarios y roles' })).not.toBeInTheDocument();
  });
  it('valida creación sin enviar datos incompletos', async () => {
    setup('/usuarios/nuevo'); const form = await screen.findByRole('form', { name: 'Crear usuario' });
    await userEvent.click(within(form).getByRole('button', { name: 'Crear usuario' }));
    expect(screen.getByText('Introduce un correo electrónico válido.')).toBeVisible(); expect(screen.getByLabelText('Correo electrónico')).toHaveFocus();
    expect(screen.getByText('Selecciona un rol permitido.')).toBeVisible(); expect(usersApi.create).not.toHaveBeenCalled();
  });
  it('crea usuario normalizado y lo muestra en el listado', async () => {
    vi.mocked(usersApi.create).mockImplementation(async (values) => { const user = { ...account, email: values.email, estado: values.estado }; vi.mocked(usersApi.list).mockResolvedValue([user]); return user; });
    setup(); await screen.findByRole('table'); await userEvent.click(screen.getByRole('link', { name: 'Crear usuario' }));
    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'NEW@EXAMPLE.COM'); await userEvent.type(screen.getByLabelText('Contraseña'), 'initial-password-123');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'new-password');
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'admin'); await userEvent.selectOptions(screen.getByLabelText('Estado'), 'INACTIVO');
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));
    expect(await screen.findByRole('cell', { name: 'new@example.com' })).toBeVisible(); expect(screen.getByText('Inactivo')).toBeVisible();
    expect(usersApi.create).toHaveBeenCalledWith({ email: 'new@example.com', password: 'initial-password-123', rol_id: 'admin', estado: 'INACTIVO' });
  });
  it('edita email, rol y estado sin campo contraseña; refleja cambios', async () => {
    vi.mocked(usersApi.update).mockImplementation(async (_id, values) => { const user = { ...account, ...values, rol: roles[1] }; vi.mocked(usersApi.list).mockResolvedValue([user]); return user; });
    setup('/usuarios/user-id/editar'); const email = await screen.findByLabelText('Correo electrónico');
    expect(email).toHaveValue(account.email); expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
    await userEvent.clear(email); await userEvent.type(email, 'changed@example.com'); await userEvent.selectOptions(screen.getByLabelText('Rol'), 'audit'); await userEvent.selectOptions(screen.getByLabelText('Estado'), 'BLOQUEADO');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('cell', { name: 'changed@example.com' })).toBeVisible(); expect(screen.getByText('Bloqueado')).toBeVisible();
    expect(usersApi.update).toHaveBeenCalledWith('user-id', { email: 'changed@example.com', rol_id: 'audit', estado: 'BLOQUEADO' });
  });
  it.each([new ApiError('Ya existe un usuario con ese correo electrónico.', 409), 'unexpected'])('muestra fallo al guardar sin perder datos: %s', async (cause) => {
    vi.mocked(usersApi.update).mockRejectedValue(cause); setup('/usuarios/user-id/editar'); await screen.findByLabelText('Correo electrónico');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue(account.email);
  });
  it('carga formulario, maneja ausencia de roles y reintenta error', async () => {
    vi.mocked(usersApi.roles).mockRejectedValueOnce(new Error('falló carga')).mockResolvedValue([]); setup('/usuarios/nuevo');
    expect(await screen.findByRole('alert')).toHaveTextContent('falló carga'); await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(/No hay roles permitidos/)).toBeVisible();
  });
  it.each([401, 403, 404])('rechaza carga de edición HTTP %s', async (status) => {
    vi.mocked(usersApi.get).mockRejectedValue(new ApiError('No permitido', status)); setup('/usuarios/user-id/editar');
    if (status === 401) expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
    else expect(await screen.findByRole('alert')).toHaveTextContent('No permitido');
  });
  it('sesión expirada durante edición vuelve a login', async () => {
    vi.mocked(usersApi.update).mockRejectedValue(new ApiError('expired', 401)); setup('/usuarios/user-id/editar'); await screen.findByLabelText('Correo electrónico');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('logout sigue disponible en administración', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined); setup(); await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' })); expect(await screen.findByRole('heading', { name: 'Acceso al sistema' })).toBeVisible();
  });
  it('muestra carga al guardar', async () => {
    let resolve!: (value: UserAccount) => void; vi.mocked(usersApi.update).mockReturnValue(new Promise((done) => { resolve = done; }));
    setup('/usuarios/user-id/editar'); await screen.findByLabelText('Correo electrónico');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); expect(screen.getByRole('button', { name: /Guardando usuario/ })).toBeDisabled();
    await act(async () => resolve(account)); expect(await screen.findByRole('table')).toBeVisible();
  });
});
