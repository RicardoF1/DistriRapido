import { useEffect, useState, type FormEvent } from 'react';
import { driverAccountsApi, driversApi } from '../../services/drivers-api';
import { ApiError } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Driver, DriverAccountPage } from '../../types/drivers';
import { DriverCredentialsPanel } from './DriverCredentialsPanel';

export function DriverAccountsPanel({ driver, administrator, onUpdated }: { driver: Driver; administrator: boolean; onUpdated: (driver: Driver) => void }) {
  const { acceptSession } = useAuth();
  const [mode, setMode] = useState<'link' | 'create' | null>(null);
  const [options, setOptions] = useState<DriverAccountPage>();
  const [loading, setLoading] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(''); const [confirmed, setConfirmed] = useState(false);
  const [search, setSearch] = useState(''); const [term, setTerm] = useState(''); const [page, setPage] = useState(1); const [attempt, setAttempt] = useState(0);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState('');
  const current = driver.cuenta?.usuario_id ?? null;
  const linked = driver.cuenta_vinculada ?? Boolean(driver.cuenta);
  const replacing = Boolean(current && selected && current !== selected);
  useEffect(() => {
    if (mode !== 'link' || !administrator) return;
    const controller = new AbortController(); setLoading(true); setError(''); setOptions(undefined);
    driverAccountsApi.options(driver.conductor_id, term, page, controller.signal).then(value => { if (!controller.signal.aborted) setOptions(value); }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) acceptSession(null);
      else setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las cuentas elegibles.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [mode, administrator, driver.conductor_id, term, page, attempt, acceptSession]);
  function close() { setMode(null); setError(''); setPassword(''); setRepeat(''); setConfirmed(false); }
  async function reloadAccount() {
    setBusy(true);
    try { onUpdated(await driversApi.get(driver.conductor_id)); close(); setSelected(''); }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) acceptSession(null); else setError(cause instanceof Error ? cause.message : 'No se pudo recargar la cuenta actual.'); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setError('');
    if (mode === 'link' && (!selected || selected === current || (replacing && !confirmed))) return;
    if (mode === 'create' && (password.length < 12 || password.length > 128 || password !== repeat)) { setError('Introduce una contraseña de 12 a 128 caracteres y confirma el mismo valor.'); return; }
    setBusy(true);
    try {
      const result = mode === 'create' ? await driverAccountsApi.create(driver.conductor_id, { email: email.trim().toLowerCase(), password }) : await driverAccountsApi.link(driver.conductor_id, { usuario_id: selected, expected_usuario_id: current, confirm_replacement: confirmed });
      onUpdated(result); close(); setNotice('Cuenta de acceso actualizada correctamente.');
    } catch (cause) { if (cause instanceof ApiError && cause.status === 401) acceptSession(null); else setError(cause instanceof Error ? cause.message : 'No se pudo gestionar la cuenta.'); }
    finally { setBusy(false); }
  }
  return <section className="driver-account-panel" aria-labelledby="driver-account-title"><h2 id="driver-account-title">Cuenta de acceso</h2>
    <p>{linked ? 'Cuenta vinculada' : 'Sin cuenta vinculada'}</p>
    {administrator && driver.cuenta && <dl className="driver-detail"><div><dt>Correo de acceso</dt><dd>{driver.cuenta.email}</dd></div><div><dt>Estado de cuenta</dt><dd>{driver.cuenta.estado}</dd></div></dl>}
    {administrator && current && !mode && <DriverCredentialsPanel key={driver.conductor_id + current} id={driver.conductor_id} />}
    {notice && <p role="status">{notice}</p>}
    {administrator && <>
      {!mode && <div className="driver-actions"><button type="button" className="button button-secondary" disabled={linked && !current} onClick={() => { setNotice(''); setMode('link'); setSelected(current ?? ''); setConfirmed(false); }}>{linked ? 'Cambiar cuenta vinculada' : 'Vincular cuenta existente'}</button>{!linked && <button type="button" className="button button-secondary" onClick={() => { setNotice(''); setError(''); setMode('create'); }}>Crear cuenta de conductor</button>}</div>}
      {mode === 'link' && <><form className="driver-filters" onSubmit={e => { e.preventDefault(); setTerm(search); setPage(1); setAttempt(x => x + 1); }}><label>Buscar correo de cuenta<input value={search} maxLength={255} onChange={e => setSearch(e.target.value)} /></label><button className="button button-secondary" disabled={busy}>Buscar cuentas</button></form>
        {loading && <p role="status">Cargando cuentas elegibles…</p>}
        {!loading && options && !error && <form className="driver-account-form" onSubmit={submit}>
          <label className="form-field">Cuenta elegible<select value={selected} disabled={busy} onChange={e => { setSelected(e.target.value); setConfirmed(false); }}><option value="">Selecciona una cuenta</option>{current && !options.items.some(x => x.usuario_id === current) && <option value={current} disabled>{driver.cuenta?.email} (cuenta actual)</option>}{options.items.map(a => <option key={a.usuario_id} value={a.usuario_id}>{a.email}</option>)}</select></label>
          {!options.items.length && <p>No hay cuentas elegibles para esta búsqueda.</p>}
          {replacing && <label className="driver-account-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />Confirmo sustituir la cuenta vinculada.</label>}
          <div className="driver-actions"><button className="button button-primary" disabled={busy || !selected || selected === current || (replacing && !confirmed)}>{busy ? 'Guardando…' : 'Vincular cuenta'}</button></div>
          <div className="driver-actions"><button type="button" className="button button-secondary" disabled={busy || page <= 1} onClick={() => setPage(p => p - 1)}>Cuentas anteriores</button><span>Página {page}</span><button type="button" className="button button-secondary" disabled={busy || page * options.pageSize >= options.total} onClick={() => setPage(p => p + 1)}>Más cuentas</button></div>
        </form>}
      </>}
      {mode === 'create' && <form className="driver-account-form" onSubmit={submit}><fieldset disabled={busy}><legend>Crear cuenta de conductor</legend><label className="form-field">Correo de acceso<input type="email" autoComplete="off" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} /></label><label className="form-field">Contraseña nueva<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label><label className="form-field">Confirmar contraseña nueva<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={repeat} onChange={e => setRepeat(e.target.value)} /></label><p>Se creará una cuenta activa con rol Conductor y se vinculará a esta ficha. No se cambiará ninguna contraseña existente.</p><button className="button button-primary">{busy ? 'Creando…' : 'Crear y vincular cuenta'}</button></fieldset></form>}
      {error && <><p role="alert">{error}</p>{mode === 'link' && <button type="button" className="button button-secondary" disabled={busy} onClick={() => setAttempt(x => x + 1)}>Reintentar carga de cuentas</button>}<button type="button" className="button button-secondary" disabled={busy} onClick={reloadAccount}>Recargar cuenta actual</button></>}
      {mode && <button type="button" className="button button-secondary" disabled={busy} onClick={close}>Cancelar gestión de cuenta</button>}
    </>}
  </section>;
}
