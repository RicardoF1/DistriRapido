import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { routesApi } from '../services/routes-api';
import { ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { RouteMap } from '../features/routes/RouteMap';
import { RouteAssignmentPanel } from '../features/routes/RouteAssignmentPanel';
import { routeMethod } from '../features/routes/route-method';
import { warningLabel } from '../features/routes/route-warnings';
import type { RouteAssignment, RouteDetail } from '../types/routes';
const date = (value: string) => new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' });
function assignmentBlock(data: RouteDetail, version: RouteDetail['versiones'][number]): string | null {
  if (version.numero !== data.current_version) return 'Estás consultando una versión histórica. Solo la versión actual puede asignarse.';
  if (data.estado === 'EN_CURSO') return 'La ruta está en curso y no admite asignación.';
  if (data.estado === 'COMPLETADA') return 'La ruta está completada y no admite asignación.';
  if (data.estado !== 'GENERADA' || data.conductor_id) return 'La ruta ya fue asignada. Esta interfaz no permite reasignar.';
  if (!version.resultado.confirmable) return 'La ruta no es confirmable. Revisa las restricciones antes de asignarla.';
  return null;
}
export function RouteDetailPage() {
  const { id } = useParams(); const { acceptSession } = useAuth(); const [data, setData] = useState<RouteDetail>(); const [version, setVersion] = useState<number>(); const [attempt, setAttempt] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const expire = useCallback(() => acceptSession(null), [acceptSession]);
  const reload = useCallback(() => setAttempt(x => x + 1), []);
  const assigned = useCallback((result: RouteAssignment) => { setNotice(`Ruta asignada a ${result.conductor.nombre_completo} el ${date(result.asignado_en)}.`); setAttempt(x => x + 1); }, []);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); routesApi.get(id!, version, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch((cause: unknown) => { if (controller.signal.aborted) return; if (cause instanceof ApiError && cause.status === 401) acceptSession(null); else setError(cause instanceof Error ? cause.message : 'No se pudo cargar el recorrido.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [id, version, attempt, acceptSession]);
  const v = data?.versiones[0];
  const block = data && v ? assignmentBlock(data, v) : null;
  return <section className="users-panel routing-panel"><div className="page-heading"><h1>Detalle de recorrido</h1><Link to="/rutas">Volver a rutas</Link></div>{notice && <p role="status">{notice}</p>}{loading ? <p role="status">Cargando recorrido…</p> : error ? <><p role="alert">{error}</p><button onClick={() => setAttempt(x => x + 1)}>Reintentar consulta</button></> : data && v && <>
    <h2>{data.alternativa.ejecucion.version.planificacion.etiqueta}</h2><p>Versión {v.numero} · {routeMethod(data.alternativa.metodo)} · Sin optimización genética.{v.resultado.estrategia ? ' Estrategia: ' + v.resultado.estrategia.nombre + '.' : ''}</p><label>Versión registrada<select value={v.numero} onChange={e => setVersion(Number(e.target.value))}>{Array.from({ length: data.current_version }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
    <RouteMap version={v} />
    <dl className="driver-detail"><div><dt>Origen</dt><dd>{v.resultado.origin.label}</dd></div><div><dt>Finalización</dt><dd>{v.resultado.return_to_origin ? 'Regresa al origen' : 'Último pedido'}</dd></div><div><dt>Distancia calculada</dt><dd>{(Number(v.distancia_m) / 1000).toFixed(2)} km</dd></div><div><dt>Viaje estimado</dt><dd>{(Number(v.duracion_s) / 60).toFixed(1)} min</dd></div><div><dt>Duración con atención y esperas</dt><dd>{(v.resultado.operational_duration_s / 60).toFixed(1)} min</dd></div><div><dt>Fin estimado</dt><dd>{date(v.resultado.end)}</dd></div></dl>
    <p>Proveedor: {v.resultado.provenance.provider} · Perfil: {v.resultado.provenance.profile} · Revisión: {v.resultado.provenance.revision} · Datos OSM: {v.resultado.provenance.data_version ?? 'Versión no informada'} · Cálculo: {date(v.resultado.provenance.calculated_at)}</p>
    <p>No implica tráfico en tiempo real ni confirmación operativa.</p>
    <h2>Asignación</h2><dl className="driver-detail"><div><dt>Estado</dt><dd>{data.estado}</dd></div><div><dt>Conductor</dt><dd>{data.conductor?.nombre_completo ?? 'Sin asignar'}</dd></div><div><dt>Asignada el</dt><dd>{data.asignado_en ? date(data.asignado_en) : 'Sin asignar'}</dd></div></dl>
    {block ? <p>{block}</p> : <RouteAssignmentPanel routeId={data.ruta_id} onAssigned={assigned} onReload={reload} onSessionExpired={expire} />}
    {v.resultado.warnings.length > 0 && <div role="status"><strong>Restricciones y datos no evaluables:</strong><ul>{v.resultado.warnings.map(w => <li key={w}><span>{warningLabel(w)}</span> <code>{w}</code></li>)}</ul></div>}
    {data.current_warnings.length > 0 && <p role="status">Los pedidos actuales difieren de esta versión histórica. No se recalculó ni modificó el recorrido.</p>}
    <h2>Paradas ordenadas</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Paradas del recorrido"><table><thead><tr><th>Orden</th><th>Pedido y destino</th><th>Llegada estimada</th><th>Atención y salida</th><th>Estado actual</th></tr></thead><tbody>{v.paradas.map(p => <tr key={p.pedido_id}><td>{p.secuencia}</td><td><Link to={'/pedidos/' + p.pedido_id}>{p.pedido_id}</Link><p>{p.datos.direccion}</p></td><td>{date(p.datos.arrival)}</td><td>{p.datos.service_minutes} min · {date(p.datos.departure)}</td><td>{p.pedido.estado}</td></tr>)}</tbody></table></div>
  </>}</section>;
}
