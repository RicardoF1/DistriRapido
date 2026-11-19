import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { routesApi } from '../services/routes-api';
import { ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { RouteMap } from '../features/routes/RouteMap';
import { RouteAssignmentPanel } from '../features/routes/RouteAssignmentPanel';
import { RouteConfirmationPanel } from '../features/routes/RouteConfirmationPanel';
import { confirmationPending } from '../features/routes/route-confirmation';
import { RouteSustainabilityPanel, RouteSustainabilitySummary } from '../features/routes/RouteSustainabilityPanel';
import { initialSustainabilityForm } from '../features/routes/route-sustainability';
import { RouteLifecycle } from '../features/routes/RouteLifecycle';
import { routeMethod } from '../features/routes/route-method';
import { warningLabel } from '../features/routes/route-warnings';
import type { RouteAssignment, RouteConfirmation, RouteDetail, RouteState, RouteSustainability } from '../types/routes';
const date = (value: string) => new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' });
function assignmentBlock(data: RouteDetail, version: RouteDetail['versiones'][number]): string | null {
  if (version.numero !== data.current_version) return 'Estás consultando una versión histórica. Solo la versión actual puede asignarse.';
  if (data.estado === 'EN_CURSO') return 'La ruta está en curso y no admite asignación.';
  if (data.estado === 'COMPLETADA') return 'La ruta está completada y no admite asignación.';
  if (data.estado === 'GENERADA' && !data.conductor_id) return 'Confirma la ruta antes de asignarle un conductor.';
  if (data.estado !== 'CONFIRMADA' || data.conductor_id) return 'La ruta ya fue asignada. Esta interfaz no permite reasignar.';
  if (!version.resultado.confirmable) return 'La ruta no es confirmable. Revisa las restricciones antes de asignarla.';
  return null;
}
const REGISTRABLE_STATES: RouteState[] = ['CONFIRMADA', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA'];
/** US-021: solo la versión actual de una ruta confirmada (o posterior) admite registrar sostenibilidad. */
function sustainabilityBlock(data: RouteDetail, version: RouteDetail['versiones'][number]): string | null {
  if (version.numero !== data.current_version) return 'Estás consultando una versión histórica. Consulta la versión actual para registrar su información de sostenibilidad.';
  if (!REGISTRABLE_STATES.includes(data.estado)) return 'Confirma la ruta antes de registrar su información de sostenibilidad.';
  return null;
}
export function RouteDetailPage() {
  const { id } = useParams(); const { acceptSession } = useAuth(); const [data, setData] = useState<RouteDetail>(); const [version, setVersion] = useState<number>(); const [attempt, setAttempt] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const expire = useCallback(() => acceptSession(null), [acceptSession]);
  const reload = useCallback(() => setAttempt(x => x + 1), []);
  const confirmed = useCallback((result: RouteConfirmation) => { setNotice(`Ruta confirmada el ${date(result.confirmado_en)}; ya puedes asignar un conductor.`); setAttempt(x => x + 1); }, []);
  const assigned = useCallback((result: RouteAssignment) => { setNotice(`Ruta asignada a ${result.conductor.nombre_completo} el ${date(result.asignado_en)}.`); setAttempt(x => x + 1); }, []);
  const registered = useCallback((result: RouteSustainability) => { setNotice(`Información de sostenibilidad registrada el ${date(result.registrado_en)}`); setAttempt(x => x + 1); }, []);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); routesApi.get(id!, version, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch((cause: unknown) => { if (controller.signal.aborted) return; if (cause instanceof ApiError && cause.status === 401) acceptSession(null); else setError(cause instanceof Error ? cause.message : 'No se pudo cargar el recorrido.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [id, version, attempt, acceptSession]);
  const v = data?.versiones[0];
  let content: ReactNode = null;
  if (loading) content = <p><output>Cargando recorrido…</output></p>;
  else if (error) content = <><p role="alert">{error}</p><button onClick={reload}>Reintentar consulta</button></>;
  else if (data && v) content = <RouteVersionDetail data={data} v={v} onVersionChange={setVersion} onConfirmed={confirmed} onAssigned={assigned} onRegistered={registered} onReload={reload} onSessionExpired={expire} />;
  return <section className="users-panel routing-panel"><div className="page-heading"><h1>Detalle de recorrido</h1><Link to="/rutas">Volver a rutas</Link></div>{notice && <p><output>{notice}</output></p>}{content}</section>;
}
interface RouteVersionDetailProps {
  data: RouteDetail;
  v: RouteDetail['versiones'][number];
  onVersionChange: (version: number) => void;
  onConfirmed: (result: RouteConfirmation) => void;
  onAssigned: (result: RouteAssignment) => void;
  onRegistered: (result: RouteSustainability) => void;
  onReload: () => void;
  onSessionExpired: () => void;
}
function RouteVersionDetail({ data, v, onVersionChange, onConfirmed, onAssigned, onRegistered, onReload, onSessionExpired }: Readonly<RouteVersionDetailProps>) {
  const block = assignmentBlock(data, v);
  const sustainabilityBlocked = sustainabilityBlock(data, v);
  let sustainability: ReactNode;
  if (data.sostenibilidad) sustainability = <RouteSustainabilitySummary record={data.sostenibilidad} />;
  else if (sustainabilityBlocked) sustainability = <p className="detail-hint">{sustainabilityBlocked}</p>;
  else sustainability = <RouteSustainabilityPanel key={`${data.ruta_id}-${v.numero}`} routeId={data.ruta_id} routeState={data.estado} initial={initialSustainabilityForm(v)} onRegistered={onRegistered} onReload={onReload} onSessionExpired={onSessionExpired} />;
  const confirmable = data.estado === 'GENERADA' && !data.conductor_id && v.numero === data.current_version;
  return <>
    <div className="route-summary-head">
      <div><h2>{data.alternativa.ejecucion.version.planificacion.etiqueta}</h2><p className="route-meta">Versión {v.numero} · {routeMethod(data.alternativa.metodo)} · Sin optimización genética.{v.resultado.estrategia ? ' Estrategia: ' + v.resultado.estrategia.nombre + '.' : ''}</p></div>
      <label className="route-version-select">Versión registrada<select value={v.numero} onChange={e => onVersionChange(Number(e.target.value))}>{Array.from({ length: data.current_version }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
    </div>
    <RouteLifecycle state={data.estado} />
    <section className="detail-section" aria-label="Resumen del recorrido">
      <dl className="route-stats"><div><dt>Distancia calculada</dt><dd>{(Number(v.distancia_m) / 1000).toFixed(2)} km</dd></div><div><dt>Viaje estimado</dt><dd>{(Number(v.duracion_s) / 60).toFixed(1)} min</dd></div><div><dt>Duración con atención y esperas</dt><dd>{(v.resultado.operational_duration_s / 60).toFixed(1)} min</dd></div><div><dt>Fin estimado</dt><dd>{date(v.resultado.end)}</dd></div><div><dt>Origen</dt><dd>{v.resultado.origin.label}</dd></div><div><dt>Finalización</dt><dd>{v.resultado.return_to_origin ? 'Regresa al origen' : 'Último pedido'}</dd></div></dl>
      <RouteMap version={v} />
      <p className="route-provenance">Proveedor: {v.resultado.provenance.provider} · Perfil: {v.resultado.provenance.profile} · Revisión: {v.resultado.provenance.revision} · Datos OSM: {v.resultado.provenance.data_version ?? 'Versión no informada'} · Cálculo: {date(v.resultado.provenance.calculated_at)}</p>
      <p className="route-provenance">No implica tráfico en tiempo real ni confirmación operativa.</p>
      {v.resultado.warnings.length > 0 && <div role="status" className="route-warnings"><strong>Restricciones y datos no evaluables:</strong><ul>{v.resultado.warnings.map(w => <li key={w}><span>{warningLabel(w)}</span> <code>{w}</code></li>)}</ul></div>}
      {data.current_warnings.length > 0 && <p role="status" className="route-warnings">Los pedidos actuales difieren de esta versión histórica. No se recalculó ni modificó el recorrido.</p>}
    </section>
    <div className="detail-grid">
      <section className="detail-section">
        <h2>Confirmación</h2><dl className="detail-facts"><div><dt>Confirmada el</dt><dd>{data.confirmado_en ? date(data.confirmado_en) : 'Sin confirmar'}</dd></div><div><dt>Confirmada por</dt><dd>{data.confirmador?.email ?? 'Sin confirmar'}</dd></div><div><dt>Versión confirmada</dt><dd>{data.version_confirmada ?? 'Sin confirmar'}</dd></div></dl>
        {confirmable && <RouteConfirmationPanel routeId={data.ruta_id} pending={confirmationPending(data, v)} onConfirmed={onConfirmed} onReload={onReload} onSessionExpired={onSessionExpired} />}
      </section>
      <section className="detail-section">
        <h2>Asignación</h2><dl className="detail-facts"><div><dt>Conductor</dt><dd>{data.conductor?.nombre_completo ?? 'Sin asignar'}</dd></div><div><dt>Asignada el</dt><dd>{data.asignado_en ? date(data.asignado_en) : 'Sin asignar'}</dd></div></dl>
        {block ? <p className="detail-hint">{block}</p> : <RouteAssignmentPanel routeId={data.ruta_id} onAssigned={onAssigned} onReload={onReload} onSessionExpired={onSessionExpired} />}
      </section>
    </div>
    <section className="detail-section">
      <h2>Sostenibilidad</h2>
      {sustainability}
    </section>
    <section className="detail-section">
      <h2>Paradas ordenadas</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Paradas del recorrido"><table><thead><tr><th>Orden</th><th>Pedido y destino</th><th>Llegada estimada</th><th>Atención y salida</th><th>Estado actual</th></tr></thead><tbody>{v.paradas.map(p => <tr key={p.pedido_id}><td>{p.secuencia}</td><td><Link to={'/pedidos/' + p.pedido_id}>{p.pedido_id}</Link><p>{p.datos.direccion}</p></td><td>{date(p.datos.arrival)}</td><td>{p.datos.service_minutes} min · {date(p.datos.departure)}</td><td>{p.pedido.estado}</td></tr>)}</tbody></table></div>
    </section>
  </>;
}
