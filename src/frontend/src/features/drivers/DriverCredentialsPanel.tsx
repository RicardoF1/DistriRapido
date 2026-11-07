import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../services/api';
import { driverCredentialsApi, type CredentialAccount, type NewPassword } from '../../services/driver-credentials-api';
import { useAuth } from '../../hooks/useAuth';

function PasswordForm({ own = false, save, cancel }: { own?: boolean; save: (data: NewPassword & { current_password: string }) => Promise<void>; cancel: () => void }) {
  const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState(''); const [current, setCurrent] = useState('');
  const [confirmed, setConfirmed] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setError('');
    if ([...password].length < 12 || [...password].length > 128 || !password.trim() || password !== repeat) { setError('Usa de 12 a 128 caracteres y confirma el mismo valor.'); return; }
    if (!own && !confirmed) return;
    setBusy(true);
    try { await save({ password, password_confirmation: repeat, current_password: current }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cambiar la contraseña.'); }
    finally { setPassword(''); setRepeat(''); setCurrent(''); setConfirmed(false); setBusy(false); }
  }
  return <form className="driver-account-form" onSubmit={submit}><fieldset disabled={busy}><legend>{own ? 'Cambiar contraseña propia' : 'Nueva contraseña de la cuenta vinculada'}</legend>
    <p>Usa de 12 a 128 caracteres. Puedes elegir una frase fácil de recordar. No se exige una combinación de mayúsculas, números y símbolos. No reutilices contraseñas.</p>
    {own && <label className="form-field">Contraseña actual<input type="password" autoComplete="current-password" required maxLength={256} value={current} onChange={e => setCurrent(e.target.value)} /></label>}
    <label className="form-field">Contraseña nueva<input type="password" autoComplete="new-password" required maxLength={256} value={password} onChange={e => setPassword(e.target.value)} /></label>
    <label className="form-field">Confirmar contraseña nueva<input type="password" autoComplete="new-password" required maxLength={256} value={repeat} onChange={e => setRepeat(e.target.value)} /></label>
    <p>Se cerrarán todas las sesiones anteriores, incluida la sesión actual del conductor. Será necesario iniciar sesión de nuevo.</p>
    {!own && <><p>Comunica la nueva contraseña al conductor por un canal seguro. El sistema no la enviará ni la mostrará después. Es una contraseña definitiva, sin caducidad temporal.</p><label className="driver-account-confirm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Confirmo restablecer esta cuenta y cerrar sus sesiones anteriores.</label></>}
    {error && <p role="alert">{error}</p>}
    <div className="driver-actions"><button className="button button-primary" disabled={busy || !own && !confirmed}>{busy ? 'Guardando…' : own ? 'Guardar nueva contraseña' : 'Confirmar restablecimiento'}</button><button type="button" className="button button-secondary" onClick={cancel}>{own ? 'Cancelar cambio de contraseña' : 'Cancelar restablecimiento'}</button></div>
  </fieldset></form>;
}

export function DriverCredentialsPanel({ id }: { id: string }) {
  const { acceptSession } = useAuth(); const [open, setOpen] = useState(false); const [attempt, setAttempt] = useState(0);
  const [account, setAccount] = useState<CredentialAccount>(); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!open) return; const controller = new AbortController();
    driverCredentialsApi.metadata(id, controller.signal).then(value => { if (!controller.signal.aborted) setAccount(value); }).catch((cause: unknown) => { if (controller.signal.aborted) return; if (cause instanceof ApiError && cause.status === 401) acceptSession(null); else setError(cause instanceof Error ? cause.message : 'No se pudo cargar la cuenta.'); });
    return () => controller.abort();
  }, [id, open, attempt, acceptSession]);
  return <div>{notice && <p role="status">{notice}</p>}{!open ? <button type="button" className="button button-secondary" onClick={() => { setAccount(undefined); setError(''); setNotice(''); setOpen(true); }}>Restablecer contraseña</button> : <>
    {!account && !error && <p role="status">Comprobando cuenta vinculada…</p>}
    {error && <><p role="alert">{error}</p><button type="button" className="button button-secondary" onClick={() => { setError(''); setAccount(undefined); setAttempt(x => x + 1); }}>Reintentar carga</button></>}
    {account && <><p>Cuenta a restablecer: <strong>{account.email}</strong> · {account.estado}</p><PasswordForm save={async ({ password, password_confirmation }) => {
      try { const result = await driverCredentialsApi.reset(id, { password, password_confirmation, expected_usuario_id: account.usuario_id, expected_credentials_version: account.credentials_version, confirmed: true }); setNotice(result.message); setOpen(false); setAccount(undefined); }
      catch (cause) { if (cause instanceof ApiError && cause.status === 401) acceptSession(null); if (cause instanceof ApiError && cause.status === 409) { setAccount(undefined); setError('La cuenta cambió. Vuelve a cargarla antes de confirmar.'); } throw cause; }
    }} cancel={() => { setOpen(false); setAccount(undefined); setError(''); }} /></>}
    {!account && <button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancelar restablecimiento</button>}
  </>}</div>;
}

export function DriverOwnPassword() {
  const { acceptSession } = useAuth(); const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return <section id="mi-cuenta" className="users-panel driver-panel-card" tabIndex={-1} aria-labelledby="driver-own-account-title"><h2 id="driver-own-account-title">Mi cuenta</h2>{!open ? <button className="button button-secondary" type="button" onClick={() => setOpen(true)}>Cambiar mi contraseña</button> : <PasswordForm own cancel={() => setOpen(false)} save={async data => {
    try {
      await driverCredentialsApi.own(data); setOpen(false);
      // One-time, non-sensitive notice survives the protected-route redirect race.
      try { sessionStorage.setItem('ecoruta.password.changed.notice', '1'); } catch { /* Navigation state remains a fallback. */ }
      acceptSession(null); navigate('/login', { replace: true, state: { passwordChanged: true } });
    }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) acceptSession(null); throw cause; }
  }} />}</section>;
}
