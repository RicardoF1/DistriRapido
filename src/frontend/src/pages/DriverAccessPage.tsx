import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { driverProfileApi, type DeliveryIncident, type DriverProfile, type DriverRouteDetail, type DriverRouteSummary } from '../services/driver-profile-api';
import { DeliveryIncidents } from '../features/drivers/DeliveryIncidents';
import { DriverOwnPassword } from '../features/drivers/DriverCredentialsPanel';
import { useDriverSectionFocus } from '../hooks/useDriverSectionFocus';
import { ROUTE_STATE_LABELS } from '../features/routes/route-states';

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'No iniciado';
const formatDistance = (value?: string) => value ? `${(Number(value) / 1000).toFixed(2)} km` : 'No disponible';
const formatDuration = (value?: string) => value ? `${(Number(value) / 60).toFixed(1)} min` : 'No disponible';

const DELIVERY_LABELS: Record<string, string> = { PENDIENTE: 'Pendiente', ENTREGADA: 'Entregada', NO_ENTREGADA: 'No entregada' };
const routeLabel = (estado: string) => ROUTE_STATE_LABELS[estado as keyof typeof ROUTE_STATE_LABELS] ?? estado;

function ProgressBar({ percentage }: Readonly<{ percentage: number }>) {
  return <span className="bar-track driver-progress" aria-hidden="true"><span className="bar-fill bar-progress" style={{ width: `${percentage}%` }} /></span>;
}

function journeySummary(count: number) {
  if (!count) return 'No tienes rutas activas asignadas.';
  const plural = count === 1 ? '' : 's';
  return `${count} ruta${plural} activa${plural} asignada${plural}.`;
}

interface DriverRoutesProps {
  loading: boolean;
  routes: DriverRouteSummary[];
  busy: string | null;
  selectedId?: string;
  onOpen: (id: string) => void;
}

function DriverRoutes({ loading, routes, busy, selectedId, onOpen }: Readonly<DriverRoutesProps>) {
  if (loading) return <p><output>Cargando rutas asignadas…</output></p>;
  if (!routes.length) return <p className="driver-empty">No tienes rutas asignadas.</p>;
  return <ul className="driver-route-list">{routes.map(route => {
    const current = selectedId === route.ruta_id;
    return <li key={route.ruta_id} className={`driver-route-card${current ? ' is-selected' : ''}`}>
      <div className="driver-route-top">
        <span className="driver-route-icon" aria-hidden="true" />
        <div className="driver-route-name"><strong>{route.version?.vehiculo.placa ?? 'Vehículo no disponible'}</strong><span>{formatDistance(route.version?.distancia_m)} · {formatDuration(route.version?.duracion_s)}</span></div>
        <span className={`status-badge route-${route.estado.toLowerCase()}`}>{routeLabel(route.estado)}</span>
      </div>
      <div className="driver-route-progress"><span>{route.progress.processed} de {route.progress.total} entregas atendidas</span><strong>{route.progress.percentage}%</strong></div>
      <ProgressBar percentage={route.progress.percentage} />
      <button type="button" className={`button ${current ? 'button-secondary' : 'button-primary'}`} aria-pressed={current} disabled={busy === route.ruta_id} onClick={() => onOpen(route.ruta_id)}>{busy === route.ruta_id ? 'Consultando…' : 'Ver entregas'}</button>
    </li>;
  })}</ul>;
}

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
  useDriverSectionFocus(profile !== null && !loadingRoutes);

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

  function addIncident(deliveryId: string, incident: DeliveryIncident) {
    setError(null);
    setNotice('Incidencia registrada y asociada a la entrega.');
    setSelected(current => current && {
      ...current,
      version: { ...current.version, paradas: current.version.paradas.map(stop => stop.parada_id === deliveryId ? { ...stop, incidencias: [...(stop.incidencias ?? []), incident] } : stop) },
    });
  }

  const totals = routes.reduce((sum, route) => ({ total: sum.total + route.progress.total, processed: sum.processed + route.progress.processed }), { total: 0, processed: 0 });

  return <AppLayout title="Mi panel" navigationLabel="Área del conductor">
    <section className="driver-portal" aria-labelledby="driver-panel-title">
      <header className="driver-portal-heading"><p className="driver-portal-eyebrow">EcoRuta Huancayo · Mi espacio</p><h1 id="driver-panel-title">Panel del conductor</h1><p>Consulta tu recorrido, registra el resultado de cada entrega y las incidencias que encuentres.</p></header>
      {notice && <p role="status" className="users-panel">{notice}</p>}
      {error && <section className="users-panel"><ErrorMessage message={error.message} />{error.retry && <button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>}</section>}
      {!profile && !error ? <p className="users-panel"><output>Comprobando tu identidad de conductor…</output></p> : profile && <>
        <div className="driver-identity"><span className="driver-identity-icon" aria-hidden="true">✓</span><div><strong>{profile.nombre_completo}</strong><p>Identidad de conductor verificada</p></div><span className="driver-identity-state">Estado administrativo: {profile.estado}</span></div>
        <div className="driver-panel-grid">
          <section id="mi-jornada" className="users-panel driver-panel-card driver-day" tabIndex={-1} aria-labelledby="driver-day-title">
            <h2 id="driver-day-title">Mi jornada</h2>
            <p className="driver-day-summary">{journeySummary(routes.length)}</p>
            <dl className="driver-day-stats">
              <div><dt>Entregas</dt><dd>{totals.total}</dd></div>
              <div className="is-done"><dt>Atendidas</dt><dd>{totals.processed}</dd></div>
              <div className="is-pending"><dt>Por atender</dt><dd>{totals.total - totals.processed}</dd></div>
            </dl>
          </section>
          <DriverOwnPassword />
          <section id="mis-rutas" className="users-panel driver-panel-card driver-routes" tabIndex={-1} aria-labelledby="driver-routes-title"><h2 id="driver-routes-title">Mis rutas</h2>
            <DriverRoutes loading={loadingRoutes} routes={routes} busy={busy} selectedId={selected?.ruta_id} onOpen={id => void openRoute(id)} />
          </section>
          <section id="mis-entregas" className="users-panel driver-panel-card driver-deliveries" tabIndex={-1} aria-labelledby="driver-deliveries-title"><h2 id="driver-deliveries-title">Mis entregas</h2>
            {!selected ? <p className="driver-empty">Selecciona una ruta en «Mis rutas» para ver sus paradas y registrar cada entrega.</p> : <>
              <div className="driver-delivery-head">
                <div className="driver-delivery-route"><strong>{selected.version.vehiculo.placa}</strong><span className={`status-badge route-${selected.estado.toLowerCase()}`}>{routeLabel(selected.estado)}</span></div>
                <p className="driver-delivery-meta">Inicio: {formatDate(selected.iniciado_en)}</p>
                <p className="driver-stop-progress">Progreso: {selected.progress.processed}/{selected.progress.total} ({selected.progress.percentage}%)<ProgressBar percentage={selected.progress.percentage} /></p>
              </div>
              <ol className="driver-stops">{selected.version.paradas.map(stop => <li key={stop.parada_id} className={`driver-stop is-${stop.estado_entrega.toLowerCase()}`}>
                <div className="driver-stop-head">
                  <span className="driver-stop-number" aria-hidden="true">{stop.secuencia}</span>
                  <div className="driver-stop-info"><strong>Parada {stop.secuencia}</strong><span className="driver-stop-address">{stop.datos.direccion ?? stop.pedido_id}</span></div>
                  <span className={`status-badge delivery-${stop.estado_entrega.toLowerCase()}`}>{DELIVERY_LABELS[stop.estado_entrega] ?? stop.estado_entrega}</span>
                </div>
                {stop.atendido_en && <p className="driver-stop-note">Atendida: {formatDate(stop.atendido_en)}</p>}
                {stop.causa_no_entrega && <p className="driver-stop-note">Causa: {stop.causa_no_entrega}</p>}
                {stop.estado_entrega === 'PENDIENTE' && <div className="driver-stop-actions">
                  <button type="button" className="button button-primary driver-deliver" disabled={busy === stop.parada_id} onClick={() => void updateDelivery(stop.parada_id, 'ENTREGADA', stop.version_entrega)}>Marcar entregada</button>
                  <div className="driver-fail">
                    <label className="form-field driver-cause">Causa de no entrega<input value={causes[stop.parada_id] ?? ''} maxLength={255} placeholder="Ej.: cliente ausente, dirección incorrecta" onChange={event => setCauses(value => ({ ...value, [stop.parada_id]: event.target.value }))} /></label>
                    <button type="button" className="button button-secondary driver-fail-button" disabled={busy === stop.parada_id} onClick={() => void updateDelivery(stop.parada_id, 'NO_ENTREGADA', stop.version_entrega)}>Registrar no entregada</button>
                  </div>
                </div>}
                <DeliveryIncidents deliveryId={stop.parada_id} sequence={stop.secuencia} incidents={stop.incidencias ?? []} canRegister={selected.estado === 'ASIGNADA' || selected.estado === 'EN_CURSO'} onRegistered={incident => addIncident(stop.parada_id, incident)} onUnauthorized={() => acceptSession(null)} />
              </li>)}</ol>
            </>}
          </section>
        </div>
      </>}
    </section>
  </AppLayout>;
}