import { useState } from 'react';
export function PasswordField({ value, onChange, error, autoComplete = 'current-password' }: { value: string; onChange: (value: string) => void; error?: string; autoComplete?: 'current-password' | 'new-password' }) {
  const [visible, setVisible] = useState(false);
  return <div className="form-field">
    <label htmlFor="password">Contraseña</label>
    <div className="password-control">
      <input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} maxLength={128} required aria-invalid={Boolean(error)} aria-describedby={error ? 'password-error' : undefined} />
      <button type="button" className="password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}>
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
    {error && <span id="password-error" className="field-error">{error}</span>}
  </div>;
}
