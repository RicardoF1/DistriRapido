import { useState, type FormEvent } from 'react';
import { authApi } from '../../services/api';
import type { LoginResponse } from '../../types/auth';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { PasswordField } from '../../components/ui/PasswordField';

const EMAIL_DRAFT_KEY = 'ecoruta.login.email';
function readEmailDraft() {
  try { return sessionStorage.getItem(EMAIL_DRAFT_KEY)?.slice(0, 255) ?? ''; }
  catch { return ''; }
}

export function LoginForm({ onSuccess }: { onSuccess: (response: LoginResponse) => void }) {
  const [email, setEmail] = useState(readEmailDraft);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(false);
  function updateEmail(value: string) {
    setEmail(value);
    try {
      if (value) sessionStorage.setItem(EMAIL_DRAFT_KEY, value);
      else sessionStorage.removeItem(EMAIL_DRAFT_KEY);
    } catch { /* El formulario sigue funcionando si el navegador bloquea el almacenamiento. */ }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors = {
      email: normalizedEmail.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ? undefined : 'Introduce un correo electrónico válido.',
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
      <input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="tu.correo@ejemplo.com" value={email} onChange={(event) => updateEmail(event.target.value)} required maxLength={255} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
      {errors.email && <span id="email-error" className="field-error">{errors.email}</span>}
    </div>
    <PasswordField value={password} onChange={setPassword} error={errors.password} />
    <LoadingButton type="submit" loading={loading}>Iniciar sesión <span aria-hidden="true">→</span></LoadingButton>
  </form>;
}
