import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DriverCredentialsPanel, DriverOwnPassword } from './DriverCredentialsPanel';
const api = vi.hoisted(() => ({ metadata: vi.fn(), reset: vi.fn(), own: vi.fn(), acceptSession: vi.fn() }));
vi.mock('../../services/driver-credentials-api', () => ({ driverCredentialsApi: api }));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ acceptSession: api.acceptSession }) }));
beforeEach(() => { vi.clearAllMocks(); api.metadata.mockResolvedValue({ usuario_id: 'user', email: 'fixture@example.test', estado: 'ACTIVO', credentials_version: 2 }); api.reset.mockResolvedValue({ message: 'Contraseña restablecida.' }); api.own.mockResolvedValue({ message: 'Contraseña actualizada.' }); });
it('confirma destinatario y versión sin persistir la contraseña; limpia al terminar', async () => {
  render(<DriverCredentialsPanel id="driver" />);
  await userEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));
  await screen.findByText('fixture@example.test');
  await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'Una frase de prueba');
  await userEvent.type(screen.getByLabelText('Confirmar contraseña nueva'), 'Una frase de prueba');
  expect(screen.getByRole('button', { name: 'Confirmar restablecimiento' })).toBeDisabled();
  await userEvent.click(screen.getByLabelText(/Confirmo restablecer/));
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar restablecimiento' }));
  await waitFor(() => expect(api.reset).toHaveBeenCalledWith('driver', expect.objectContaining({ expected_usuario_id: 'user', expected_credentials_version: 2, confirmed: true })));
  await screen.findByText('Contraseña restablecida.');
  expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument();
  expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain('Una frase de prueba');
});
it('no envía confirmación distinta y permite cancelar sin conservar campos', async () => {
  render(<DriverCredentialsPanel id="driver" />); await userEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' })); await screen.findByText('fixture@example.test');
  await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'Una frase de prueba');
  await userEvent.type(screen.getByLabelText('Confirmar contraseña nueva'), 'Otra frase diferente');
  await userEvent.click(screen.getByLabelText(/Confirmo restablecer/)); await userEvent.click(screen.getByRole('button', { name: 'Confirmar restablecimiento' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/mismo valor/); expect(api.reset).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar restablecimiento' })); expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument();
});
it('falla cerrado si no se puede cargar el destinatario y permite reintentar', async () => {
  api.metadata.mockRejectedValueOnce(new Error('Error de carga')); render(<DriverCredentialsPanel id="driver" />);
  await userEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' })); expect(await screen.findByRole('alert')).toHaveTextContent('Error de carga');
  expect(screen.queryByRole('button', { name: 'Confirmar restablecimiento' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar carga' })); await screen.findByText('fixture@example.test');
});
it('cambio propio exige actual, envía sin identificadores y cierra la sesión', async () => {
  render(<MemoryRouter><DriverOwnPassword /></MemoryRouter>); await userEvent.click(screen.getByRole('button', { name: 'Cambiar mi contraseña' }));
  await userEvent.type(screen.getByLabelText('Contraseña actual'), 'Anterior de prueba');
  await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'Una frase de prueba');
  await userEvent.type(screen.getByLabelText('Confirmar contraseña nueva'), 'Una frase de prueba');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));
  await waitFor(() => expect(api.acceptSession).toHaveBeenCalledWith(null));
  expect(api.own).toHaveBeenCalledWith({ current_password: 'Anterior de prueba', password: 'Una frase de prueba', password_confirmation: 'Una frase de prueba' });
});
