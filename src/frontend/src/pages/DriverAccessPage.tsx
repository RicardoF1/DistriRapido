import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { driverProfileApi, type DriverProfile, type DriverRouteDetail, type DriverRouteSummary } from '../services/driver-profile-api';
import { DriverOwnPassword } from '../features/drivers/DriverCredentialsPanel';
import { revealDriverSection } from '../features/drivers/driver-sections';
import { useLocationHash } from '../hooks/useLocationHash';

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'No iniciado';
const formatDistance = (value?: string) => value ? `${(Number(value) / 1000).toFixed(2)} km` : 'No disponible';
const formatDuration = (value?: string) => value ? `${(Number(value) / 60).toFixed(1)} min` : 'No disponible';

export function DriverAccessPage() {
  const { session, acceptSession } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [routes, setRoutes] = useState<DriverRouteSummary[]>([]);
  const [selected, setSelected] = useState<DriverRouteDetail | null>(null);
  const [error, setError] = useState<{ message: string; retry: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [causes, setCauses] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const hash = useLocationHash();
  const revealedHash = useRef<string | null>(null);
  const sectionsReady = profile !== null && !loadingRoutes;

  const handleError = useCallback(
    (cause: unknown, fallback: string) => {
      if (cause instanceof ApiError && cause.status === 401) {
        acceptSession(null);
        return;
      }

      setError({
        message: cause instanceof Error ? cause.message : fallback,
        retry: !(cause instanceof ApiError && cause.status === 403),
      });
    },
    [acceptSession],
  );

  useEffect(() => {
    const controller = new AbortController();
    setProfile(null); setRoutes([]); setSelected(null); setError(null); setNotice('');
    driverProfileApi.me(controller.signal).then(async value => {
      if (controller.signal.aborted) return;
      setProfile(value); setLoadingRoutes(true);
      try { const assigned = await driverProfileApi.routes(controller.signal); if (!controller.signal.aborted) setRoutes(assigned); }
      catch (cause) { if (!controller.signal.aborted) handleError(cause, 'No se pudieron consultar tus rutas.'); }
      finally { if (!controller.signal.aborted) setLoadingRoutes(false); }
    }).catch((cause: unknown) => { if (!controller.signal.aborted) handleError(cause, 'No se pudo comprobar tu identidad de conductor.'); });
    return () => controller.abort();
  }, [session, acceptSession, attempt, handleError]);

  // La restauración automática de Atrás/Adelante deshacía el desplazamiento a la sección; se recupera al salir del panel.
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  // Al cargar con hash, o al cambiarlo con enlace, Atrás o Adelante, se desplaza y enfoca la sección una sola vez.
  useEffect(() => {
    if (!sectionsReady || revealedHash.current === hash) return;
    revealedHash.current = hash;
    revealDriverSection(hash);
  }, [hash, sectionsReady]);

  async function openRoute(id: string) {
    setBusy(id); setError(null); setNotice('');
    try { setSelected(await driverProfileApi.route(id)); }
    catch (cause) { handleError(cause, 'No se pudo consultar la ruta asignada.'); }
    finally { setBusy(null); }
  }

  async function updateDelivery(id: string, estado: 'ENTREGADA' | 'NO_ENTREGADA', version: number) {
    const causa = causes[id]?.trim();
    if (estado === 'NO_ENTREGADA' && !causa) { setError({ message: 'Escribe la causa de la entrega no completada.', retry: false }); return; }
    setBusy(id); setError(null); setNotice('');
    try {
      const result = await driverProfileApi.updateDelivery(id, { estado, ...(estado === 'NO_ENTREGADA' ? { causa } : {}), expected_version: version });
      setNotice('Estado de entrega actualizado correctamente.');
      if (selected) setSelected(await driverProfileApi.route(selected.ruta_id));
      setRoutes(current => current.map(route => route.ruta_id === result.route.ruta_id ? { ...route, estado: result.route.estado, progress: result.progress } : route));
    } catch (cause) { handleError(cause, 'No se pudo actualizar la entrega.'); }
    finally { setBusy(null); }
  }

  return <AppLayout title="Mi panel" navigationLabel="Área del conductor">
    <section className="driver-portal" aria-labelledby="driver-panel-title">
      <header className="driver-portal-heading"><p className="driver-portal-eyebrow">EcoRuta Huancayo · Mi espacio</p><h1 id="driver-panel-title">Panel del conductor</h1><p>Consulta tu recorrido y registra el resultado de cada entrega.</p></header>
      {notice && <p role="status" className="users-panel">{notice}</p>}
      {error && <section className="users-panel"><ErrorMessage message={error.message} />{error.retry && <button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>}</section>}
      {!profile && !error ? <p role="status" className="users-panel">Comprobando tu identidad de conductor…</p> : profile && <>
        <div className="driver-identity"><span className="driver-identity-icon" aria-hidden="true">✓</span><div><strong>{profile.nombre_completo}</strong><p>Identidad de conductor verificada</p></div><span className="driver-identity-state">Estado administrativo: {profile.estado}</span></div>
        <div className="driver-panel-grid">
          <DriverOwnPassword />
          <section id="mi-jornada" className="users-panel driver-panel-card driver-day" tabIndex={-1} aria-labelledby="driver-day-title"><h2 id="driver-day-title">Mi jornada</h2><p>{routes.length ? `${routes.length} ruta activa asignada${routes.length === 1 ? '' : 's'}.` : 'No tienes rutas activas asignadas.'}</p></section>
          <section id="mis-rutas" className="users-panel driver-panel-card" tabIndex={-1} aria-labelledby="driver-routes-title"><h2 id="driver-routes-title">Mis rutas</h2>
            {loadingRoutes ? <p role="status">Cargando rutas asignadas…</p> : !routes.length ? <p>No tienes rutas asignadas.</p> : <ul>{routes.map(route => <li key={route.ruta_id}><strong>{route.version?.vehiculo.placa ?? 'Vehículo no disponible'}</strong> · {route.estado}<br />{formatDistance(route.version?.distancia_m)} · {formatDuration(route.version?.duracion_s)}<br />Progreso: {route.progress.processed}/{route.progress.total} ({route.progress.percentage}%) <button type="button" className="button button-secondary" disabled={busy === route.ruta_id} onClick={() => void openRoute(route.ruta_id)}>{busy === route.ruta_id ? 'Consultando…' : 'Ver entregas'}</button></li>)}</ul>}
          </section>
          <section id="mis-entregas" className="users-panel driver-panel-card" tabIndex={-1} aria-labelledby="driver-deliveries-title"><h2 id="driver-deliveries-title">Mis entregas</h2>
            {!selected ? <p>Selecciona una ruta para consultar sus entregas.</p> : <><p>Ruta {selected.estado} · {selected.version.vehiculo.placa} · Inicio: {formatDate(selected.iniciado_en)}</p><p>Progreso: {selected.progress.processed}/{selected.progress.total} ({selected.progress.percentage}%)</p><ol>{selected.version.paradas.map(stop => <li key={stop.parada_id}><strong>Parada {stop.secuencia}</strong> · {stop.datos.direccion ?? stop.pedido_id}<br />Estado: {stop.estado_entrega}{stop.atendido_en ? ` · ${formatDate(stop.atendido_en)}` : ''}{stop.causa_no_entrega ? <p>Causa: {stop.causa_no_entrega}</p> : null}{stop.estado_entrega === 'PENDIENTE' && <div className="driver-actions"><button type="button" className="button button-primary" disabled={busy === stop.parada_id} onClick={() => void updateDelivery(stop.parada_id, 'ENTREGADA', stop.version_entrega)}>Marcar entregada</button><label>Causa de no entrega<input value={causes[stop.parada_id] ?? ''} maxLength={255} onChange={event => setCauses(value => ({ ...value, [stop.parada_id]: event.target.value }))} /></label><button type="button" className="button button-secondary" disabled={busy === stop.parada_id} onClick={() => void updateDelivery(stop.parada_id, 'NO_ENTREGADA', stop.version_entrega)}>Registrar no entregada</button></div>}</li>)}</ol></>}
          </section>
        </div>
      </>}
    </section>
  </AppLayout>;
}