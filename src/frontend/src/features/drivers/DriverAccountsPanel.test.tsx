import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { DriversPage } from '../../pages/DriversPage';
const mocks = vi.hoisted(() => ({ get: vi.fn(), list: vi.fn(), update: vi.fn(), create: vi.fn(), options: vi.fn(), link: vi.fn(), createAccount: vi.fn(), acceptSession: vi.fn(), role: 'Administrador' }));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ session: { user: { rol: { nombre: mocks.role } } }, acceptSession: mocks.acceptSession }) }));
vi.mock('../../services/drivers-api', () => ({ driversApi: { get: mocks.get, list: mocks.list, update: mocks.update, create: mocks.create }, driverAccountsApi: { options: mocks.options, link: mocks.link, create: mocks.createAccount } }));
const row = { conductor_id: 'driver-id', nombre_completo: 'Fixture conductor', dni: 'fixture', telefono: 'fixture', licencia_categoria: 'fixture', anios_experiencia: 0, estado: 'ACTIVO', cuenta_vinculada: false, cuenta: null };
const account = { usuario_id: 'eligible-id', email: 'eligible@example.test', estado: 'ACTIVO' };
const linked = { ...row, cuenta_vinculada: true, cuenta: { usuario_id: 'current-id', email: 'current@example.test', estado: 'INACTIVO' } };
function open() { return render(<MemoryRouter initialEntries={['/conductores/driver-id/editar']}><Routes><Route path="/conductores/:id/editar" element={<DriversPage />} /></Routes></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); mocks.role = 'Administrador'; mocks.get.mockResolvedValue(row); mocks.options.mockResolvedValue({ items: [account], total: 1, page: 1, pageSize: 20 }); mocks.link.mockResolvedValue({ ...row, cuenta_vinculada: true, cuenta: account }); mocks.createAccount.mockResolvedValue({ ...row, cuenta_vinculada: true, cuenta: account }); });
it('selecciona por correo, sin UUID manual, y vincula explícitamente', async () => {
  open(); await screen.findByRole('heading', { name: 'Cuenta de acceso' });
  expect(screen.queryByLabelText(/UUID/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Vincular cuenta existente' }));
  await screen.findByRole('option', { name: account.email });
  await userEvent.selectOptions(screen.getByLabelText('Cuenta elegible'), account.usuario_id);
  await userEvent.click(screen.getByRole('button', { name: 'Vincular cuenta' }));
  await waitFor(() => expect(mocks.link).toHaveBeenCalledWith('driver-id', { usuario_id: account.usuario_id, expected_usuario_id: null, confirm_replacement: false }));
});
it('conserva cuenta vinculada si falla cargar opciones y no cambia la ficha', async () => {
  mocks.get.mockResolvedValue(linked); mocks.options.mockRejectedValue(new Error('Error de carga de cuentas'));
  open(); await screen.findByText(linked.cuenta.email);
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar cuenta vinculada' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Error de carga de cuentas');
  expect(screen.getByText(linked.cuenta.email)).toBeVisible(); expect(screen.getByRole('button', { name: 'Guardar conductor' })).toBeEnabled();
  expect(mocks.link).not.toHaveBeenCalled();
});
it('exige confirmación para sustituir y envía el vínculo esperado', async () => {
  mocks.get.mockResolvedValue(linked); open(); await screen.findByText(linked.cuenta.email);
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar cuenta vinculada' }));
  await screen.findByRole('option', { name: account.email }); await userEvent.selectOptions(screen.getByLabelText('Cuenta elegible'), account.usuario_id);
  expect(screen.getByRole('button', { name: 'Vincular cuenta' })).toBeDisabled(); expect(mocks.link).not.toHaveBeenCalled();
  await userEvent.click(screen.getByLabelText('Confirmo sustituir la cuenta vinculada.'));
  await userEvent.click(screen.getByRole('button', { name: 'Vincular cuenta' }));
  await waitFor(() => expect(mocks.link).toHaveBeenCalledWith('driver-id', { usuario_id: account.usuario_id, expected_usuario_id: 'current-id', confirm_replacement: true }));
});
it('operador solo ve si existe vínculo, sin correo ni acciones sensibles', async () => {
  mocks.role = 'Operador / Técnico'; mocks.get.mockResolvedValue({ ...row, cuenta_vinculada: true }); open();
  await screen.findByRole('heading', { name: 'Cuenta de acceso' }); expect(screen.getByText('Cuenta vinculada')).toBeVisible();
  expect(screen.queryByRole('button', { name: /cuenta/i })).not.toBeInTheDocument(); expect(mocks.options).not.toHaveBeenCalled();
});
it('crea y vincula mediante acción expresa, sin guardar contraseña en navegador', async () => {
  open(); await screen.findByRole('heading', { name: 'Cuenta de acceso' }); expect(mocks.createAccount).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta de conductor' }));
  await userEvent.type(screen.getByLabelText('Correo de acceso'), account.email);
  await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'fixture-password-123');
  await userEvent.type(screen.getByLabelText('Confirmar contraseña nueva'), 'fixture-password-123');
  await userEvent.click(screen.getByRole('button', { name: 'Crear y vincular cuenta' }));
  await waitFor(() => expect(mocks.createAccount).toHaveBeenCalledWith('driver-id', { email: account.email, password: 'fixture-password-123' }));
  expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain('fixture-password-123');
});
it('recarga un vínculo obsoleto sin perder los datos de la ficha ni reenviar la operación', async () => {
  mocks.link.mockRejectedValue(new Error('El vínculo cambió. Recarga la ficha.'));
  open(); await screen.findByRole('heading', { name: 'Cuenta de acceso' });
  await userEvent.clear(screen.getByLabelText('Nombre completo'));
  await userEvent.type(screen.getByLabelText('Nombre completo'), 'Borrador conservado');
  await userEvent.click(screen.getByRole('button', { name: 'Vincular cuenta existente' }));
  await screen.findByRole('option', { name: account.email });
  await userEvent.selectOptions(screen.getByLabelText('Cuenta elegible'), account.usuario_id);
  await userEvent.click(screen.getByRole('button', { name: 'Vincular cuenta' }));
  await screen.findByRole('alert'); mocks.get.mockResolvedValue(linked);
  await userEvent.click(screen.getByRole('button', { name: 'Recargar cuenta actual' }));
  await screen.findByText(linked.cuenta.email);
  expect(screen.getByLabelText('Nombre completo')).toHaveValue('Borrador conservado');
  expect(mocks.link).toHaveBeenCalledTimes(1);
});
