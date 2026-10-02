import { useState, type FormEvent } from 'react';
import { authApi } from '../../services/api';
import type { LoginResponse } from '../../types/auth';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { PasswordField } from '../../components/ui/PasswordField';

export function LoginForm({ onSuccess }: { onSuccess: (response: LoginResponse) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && normalizedEmail.length <= 255 ? undefined : 'Introduce un correo electrónico válido.',
      password: password.length > 0 ? undefined : 'Introduce tu contraseña.',
    };
    setErrors(nextErrors);
    setRequestError('');
    if (nextErrors.email || nextErrors.password) {
      document.getElementById(nextErrors.email ? 'email' : 'password')?.focus();
      return;
    }
    setLoading(true);
    try { onSuccess(await authApi.login({ email: normalizedEmail, password })); }
    catch (error) { setRequestError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.'); }
    finally { setLoading(false); }
  }
  return <form onSubmit={submit} noValidate className="login-form">
    {requestError && <ErrorMessage message={requestError} />}
    <div className="form-field">
      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="tu.correo@ejemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={255} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
      {errors.email && <span id="email-error" className="field-error">{errors.email}</span>}
    </div>
    <PasswordField value={password} onChange={setPassword} error={errors.password} />
    <LoadingButton type="submit" loading={loading}>Iniciar sesión <span aria-hidden="true">→</span></LoadingButton>
  </form>;
}
