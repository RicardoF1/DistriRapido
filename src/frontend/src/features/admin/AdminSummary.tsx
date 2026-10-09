import { useEffect, useState } from 'react';
import { adminApi, type AdminSummary as Summary } from '../../services/admin-api';
import { ApiError } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
export function AdminSummary() {
  const { session, acceptSession } = useAuth();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    // Defer until StrictMode has discarded its first development-only effect.
    const start = window.setTimeout(() => {
    adminApi.summary(controller.signal).then(summary => {
      if (!controller.signal.aborted && summary) setData(summary);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) acceptSession(null);
      setError(cause instanceof ApiError && cause.status === 403 ? 'No tienes permiso para consultar el resumen administrativo.' : cause instanceof ApiError && cause.status === 404 ? 'El backend no ofrece el resumen administrativo. Inicia la API de esta misma versión del proyecto.' : 'No se pudo cargar el resumen. Inténtalo de nuevo.');
    });
    }, 0);
    return () => { window.clearTimeout(start); controller.abort(); };
  }, [attempt, acceptSession, session?.user.usuario_id]);
  const metrics = [
    { label: 'Pedidos registrados', value: data?.totalOrders, icon: <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9v9m-9-13 9 4 9-4" /> },
    { label: 'Pedidos pendientes', value: data?.pendingOrders, icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
    { label: 'Usuarios registrados', value: data?.totalUsers, icon: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2m6 0v-2a4 4 0 0 0-3-4M16 3a4 4 0 0 1 0 8" /></> },
  ];
  const reload = () => { setData(null); setError(''); setAttempt(value => value + 1); };
  return <section className="admin-summary" aria-labelledby="admin-summary-title" aria-busy={!data && !error}>
    <div className="admin-summary-heading"><h2 id="admin-summary-title">Resumen general</h2>{data && !error && <button type="button" className="button button-secondary" onClick={reload}>Actualizar resumen</button>}</div>
    {error ? <div className="admin-summary-error"><p role="alert">{error}</p><button type="button" className="button button-primary" onClick={reload}>Reintentar resumen</button></div> : !data && <p role="status">Cargando indicadores…</p>}
    <dl className="admin-metrics">{metrics.map(metric => <div className="admin-metric" key={metric.label}>
      <span className="admin-metric-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{metric.icon}</svg></span>
      <dt>{metric.label}</dt><dd className={!data || error ? "admin-metric-value-muted" : undefined}>{error ? 'No disponible' : metric.value === undefined ? <span aria-label="Cantidad pendiente de carga">—</span> : metric.value.toLocaleString('es-PE')}</dd>
    </div>)}</dl>
    {data && !error && <>
      <div className="admin-state-summary"><h3>Pedidos por estado</h3>{data.ordersByState.length ? <dl>{data.ordersByState.map(group => <div key={group.state}><dt>{group.state}</dt><dd>{group.count.toLocaleString('es-PE')}</dd></div>)}</dl> : <p>No hay pedidos registrados.</p>}</div>
      {data.totalUsers === 0 && <p className="admin-summary-empty">No hay usuarios registrados.</p>}
    </>}
  </section>;
}
