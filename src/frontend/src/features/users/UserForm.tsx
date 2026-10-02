import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { RoleOption, UserAccount, UserValues, UserState } from '../../types/users';
import { USER_STATES } from '../../types/users';
import { RoleSelect } from './RoleSelect';
import { PasswordField } from '../../components/ui/PasswordField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
export function UserForm({ roles, initial, onSave }: { roles: RoleOption[]; initial?: UserAccount; onSave: (values: UserValues) => Promise<void> }) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState(initial?.rol_id ?? '');
  const [state, setState] = useState<UserState>(initial?.estado ?? 'ACTIVO');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase(); const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 255) next.email = 'Introduce un correo electrónico válido.';
    if (!roles.some((item) => item.rol_id === role)) next.role = 'Selecciona un rol permitido.';
    if (!initial && (password.length < 12 || password.length > 128)) next.password = 'La contraseña inicial debe tener entre 12 y 128 caracteres.';
    setErrors(next); setError('');
    if (Object.keys(next).length) { document.getElementById(next.email ? 'user-email' : next.password ? 'password' : 'user-role')?.focus(); return; }
    setLoading(true);
    try { await onSave({ email: normalized, rol_id: role, estado: state, ...(!initial ? { password } : {}) }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el usuario.'); }
    finally { setLoading(false); }
  }
  return <form className="login-form" noValidate onSubmit={submit} aria-label={initial ? 'Editar usuario' : 'Crear usuario'}>
    <div className="form-field"><label htmlFor="user-email">Correo electrónico</label><input id="user-email" type="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />{errors.email && <p className="field-error" id="email-error">{errors.email}</p>}</div>
    {!initial && <><PasswordField value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" /><p className="access-note">Contraseña inicial: entre 12 y 128 caracteres. No se mostrará después de crear la cuenta.</p></>}
    <RoleSelect roles={roles} value={role} onChange={setRole} error={errors.role} />
    <div className="form-field"><label htmlFor="user-state">Estado</label><select id="user-state" value={state} onChange={(event) => setState(event.target.value as UserState)}>{USER_STATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
    {error && <ErrorMessage message={error} />}<LoadingButton type="submit" loading={loading} loadingLabel="Guardando usuario…">{initial ? 'Guardar cambios' : 'Crear usuario'}</LoadingButton><Link className="button button-secondary" to="/usuarios">Cancelar</Link>
  </form>;
}
