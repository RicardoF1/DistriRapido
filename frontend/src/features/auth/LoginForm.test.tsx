import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { authApi } from '../../services/api';
import { loginResponse } from '../../test/fixtures';
vi.mock('../../services/api', () => ({ authApi: { login: vi.fn() } }));
describe('US-001 LoginForm', () => {
  beforeEach(() => vi.resetAllMocks());
  it('renderiza correo, contraseña y acción accesibles', () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /Iniciar sesión/ })).toBeEnabled();
  });
  it('valida campos obligatorios sin llamar a la API', async () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    expect(screen.getByText('Introduce un correo electrónico válido.')).toBeVisible();
    expect(screen.getByText('Introduce tu contraseña.')).toBeVisible();
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus(); expect(authApi.login).not.toHaveBeenCalled();
  });
  it('muestra y oculta contraseña sin alterar el valor', async () => {
    render(<LoginForm onSuccess={vi.fn()} />); await userEvent.type(screen.getByLabelText('Contraseña'), 'input');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveValue('input'); expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });
  it('enfoca contraseña cuando solo falta ese campo', async () => {
    render(<LoginForm onSuccess={vi.fn()} />); await userEvent.type(screen.getByLabelText('Correo electrónico'), 'valid@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ })); expect(screen.getByLabelText('Contraseña')).toHaveFocus();
  });
  it('envía email normalizado, muestra carga y procesa éxito', async () => {
    let resolve!: (value: typeof loginResponse) => void;
    vi.mocked(authApi.login).mockReturnValue(new Promise((done) => { resolve = done; }));
    const onSuccess = vi.fn(); render(<LoginForm onSuccess={onSuccess} />);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'TEST@EXAMPLE.COM');
    await userEvent.type(screen.getByLabelText('Contraseña'), ' input ');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: ' input ' });
    expect(screen.getByRole('button', { name: /Validando acceso/ })).toBeDisabled();
    resolve(loginResponse); await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(loginResponse));
    expect(screen.getByRole('button', { name: /Iniciar sesión/ })).toBeEnabled();
  });
  it.each([new Error('Credenciales incorrectas o usuario no habilitado.'), 'unexpected'])('muestra error y conserva campos', async (cause) => {
    vi.mocked(authApi.login).mockRejectedValue(cause); render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'test@example.com'); await userEvent.type(screen.getByLabelText('Contraseña'), 'input');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    expect(await screen.findByRole('alert')).toHaveFocus(); expect(screen.getByLabelText('Correo electrónico')).toHaveValue('test@example.com');
    expect(screen.getByRole('button', { name: /Iniciar sesión/ })).toBeEnabled();
  });
});
