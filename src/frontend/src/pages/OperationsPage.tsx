import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import {
  DELIVERY_STATES, DELIVERY_STATE_LABELS, OPERATIONAL_ROUTE_STATES, ROUTE_STATE_LABELS, operationsApi,
  type DeliveryState, type OperationalRouteState, type OperationsFilters, type OperationsPage as Page, type OperationsSummary,
} from '../services/operations-api';
import { OperationRouteDetail } from '../features/operations/OperationRouteDetail';
import { formatDateTime } from '../features/operations/format';

// US-019 / RF-016: seguimiento operativo de rutas y entregas para Administrador y Operador / Técnico.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isRouteState = (value: string | null): value is OperationalRouteState => (OPERATIONAL_ROUTE_STATES as readonly (string | null)[]).includes(value);
const isDeliveryState = (value: string | null): value is DeliveryState => (DELIVERY_STATES as readonly (string | null)[]).includes(value);

function filtersFrom(params: URLSearchParams): OperationsFilters {
  const estado = params.get('estado'); const entrega = params.get('estado_entrega');
  const desde = params.get('desde'); const hasta = params.get('hasta');
  return {
    ...(isRouteState(estado) ? { estado } : {}),
    ...(isDeliveryState(entrega) ? { estado_entrega: entrega } : {}),
    ...(desde && DATE.test(desde) ? { desde } : {}),
    ...(hasta && DATE.test(hasta) ? { hasta } : {}),
    ...(params.get('con_incidencias') === 'true' ? { con_incidencias: true } : {}),
    ...(params.get('search')?.trim() ? { search: params.get('search')!.trim().slice(0, 100) } : {}),
  };
}

function paramsFrom(filters: OperationsFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.estado) params.set('estado', filters.estado);
  if (filters.estado_entrega) params.set('estado_entrega', filters.estado_entrega);
  if (filters.desde) params.set('desde', filters.desde);
  if (filters.hasta) params.set('hasta', filters.hasta);
  if (filters.con_incidencias) params.set('con_incidencias', 'true');
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (page > 1) params.set('page', String(page));
  return params;
}

const hasFilters = (filters: OperationsFilters) => Object.keys(filters).length > 0;

function SummaryPanel({ summary, error, onRefresh }: Readonly<{ summary: OperationsSummary | null; error: string; onRefresh: () => void }>) {
  // Las tarjetas se pintan desde el inicio con «…» para reservar su espacio y evitar desplazamientos (CLS).
  const metrics = [
    ['Rutas asignadas', summary?.routes.ASIGNADA], ['Rutas en curso', summary?.routes.EN_CURSO], ['Rutas completadas', summary?.routes.COMPLETADA],
    ['Entregas pendientes', summary?.deliveries.PENDIENTE], ['Entregas realizadas', summary?.deliveries.ENTREGADA], ['Entregas no realizadas', summary?.deliveries.NO_ENTREGADA],
    ['Incidencias registradas', summary?.incidents],
  ] as const;
  return <section className="admin-summary operations-summary" aria-labelledby="operations-summary-title">
    <div className="admin-summary-heading"><h2 id="operations-summary-title">Resumen general de la operación</h2><button type="button" className="button button-secondary" onClick={onRefresh}>Actualizar resumen</button></div>
    {error ? <p role="alert" className="admin-summary-error">{error}</p>
      : <>{!summary && <p role="status" className="sr-only">Cargando resumen…</p>}<dl className="admin-metrics operations-metrics" aria-busy={!summary}>{metrics.map(([label, value]) => <div className="admin-metric" key={label}><dt>{label}</dt><dd>{value ?? '…'}</dd></div>)}</dl></>}
  </section>;
}

export function OperationsPage() {
  const { acceptSession } = useAuth();
  const [params, setParams] = useSearchParams();
  const applied = filtersFrom(params);
  const appliedKey = paramsFrom(applied, 1).toString();
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const [draft, setDraft] = useState<OperationsFilters>(applied);
  const [dateError, setDateError] = useState('');
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [summaryAttempt, setSummaryAttempt] = useState(0);
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const returnFocusTo = useRef<string | null>(null);
  const results = useRef<HTMLElement>(null);
  const id = useId();
  const unauthorized = useCallback(() => acceptSession(null), [acceptSession]);

  // Mantiene el formulario alineado con la URL (Atrás/Adelante o enlaces compartidos).
  useEffect(() => { setDraft(filtersFrom(new URLSearchParams(appliedKey))); setDateError(''); }, [appliedKey]);

  useEffect(() => {
    const controller = new AbortController();
    setSummaryError('');
    operationsApi.summary(controller.signal)
      .then(value => { if (!controller.signal.aborted) setSummary(value); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) unauthorized();
        else setSummaryError(cause instanceof Error ? cause.message : 'No se pudo consultar el resumen.');
      });
    return () => controller.abort();
  }, [summaryAttempt, unauthorized]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    operationsApi.list(filtersFrom(new URLSearchParams(appliedKey)), page, controller.signal)
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) unauthorized();
        else { setData(null); setError(cause instanceof Error ? cause.message : 'No se pudo consultar el seguimiento operativo.'); }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [appliedKey, page, attempt, unauthorized]);

  function apply(event: FormEvent) {
    event.preventDefault();
    if (draft.desde && draft.hasta && draft.desde > draft.hasta) { setDateError('La fecha «desde» no puede ser posterior a «hasta».'); return; }
    setDateError(''); setSelected(null);
    setParams(paramsFrom(draft, 1));
    setAttempt(value => value + 1);
  }
  function clear() { setDraft({}); setDateError(''); setSelected(null); setParams(new URLSearchParams()); }
  function goTo(next: number) { setSelected(null); setParams(paramsFrom(applied, next)); }
  function closeDetail() { returnFocusTo.current = selected; setSelected(null); }
  // Al cerrar el detalle, el foco vuelve al botón «Ver entregas» de la misma ruta.
  useEffect(() => {
    if (selected || !returnFocusTo.current) return;
    const routeId = returnFocusTo.current; returnFocusTo.current = null;
    results.current?.querySelector<HTMLButtonElement>(`button[data-route-id="${CSS.escape(routeId)}"]`)?.focus();
  }, [selected]);
  const set = <K extends keyof OperationsFilters>(key: K, value: OperationsFilters[K]) => setDraft(current => {
    const next = { ...current, [key]: value };
    if (value === undefined || value === '' || value === false) delete next[key];
    return next;
  });

  return <AppLayout title="Seguimiento" navigationLabel="Seguimiento operativo">
    <section className="users-panel operations-panel" aria-labelledby="operations-title">
      <div className="page-heading"><h1 id="operations-title">Seguimiento operativo</h1></div>
      <p>Consulta el estado de las rutas en operación y de sus entregas. Las rutas aún no asignadas se revisan en «Consultar rutas».</p>
      <SummaryPanel summary={summary} error={summaryError} onRefresh={() => setSummaryAttempt(value => value + 1)} />

      <form className="operations-filters" onSubmit={apply} aria-labelledby={`${id}-filters`} noValidate>
        <h2 id={`${id}-filters`}>Filtros</h2>
        <div className="operations-filter-grid">
          <label className="form-field">Estado de la ruta
            <select value={draft.estado ?? ''} onChange={event => set('estado', (event.target.value || undefined) as OperationalRouteState | undefined)}>
              <option value="">Todos</option>{OPERATIONAL_ROUTE_STATES.map(state => <option key={state} value={state}>{ROUTE_STATE_LABELS[state]}</option>)}
            </select>
          </label>
          <label className="form-field">Con entregas en estado
            <select value={draft.estado_entrega ?? ''} onChange={event => set('estado_entrega', (event.target.value || undefined) as DeliveryState | undefined)}>
              <option value="">Cualquiera</option>{DELIVERY_STATES.map(state => <option key={state} value={state}>{DELIVERY_STATE_LABELS[state]}</option>)}
            </select>
          </label>
          <label className="form-field">Asignada desde
            <input type="date" value={draft.desde ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('desde', event.target.value || undefined)} />
          </label>
          <label className="form-field">Asignada hasta
            <input type="date" value={draft.hasta ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('hasta', event.target.value || undefined)} />
          </label>
          <label className="form-field">Placa o conductor
            <input type="search" value={draft.search ?? ''} maxLength={100} onChange={event => set('search', event.target.value || undefined)} />
          </label>
          <label className="operations-checkbox"><input type="checkbox" checked={draft.con_incidencias ?? false} onChange={event => set('con_incidencias', event.target.checked || undefined)} /> Solo rutas con incidencias</label>
        </div>
        {dateError && <p id={`${id}-date-error`} className="field-error" role="alert">{dateError}</p>}
        <div className="driver-actions">
          <button type="submit" className="button button-primary">Aplicar filtros</button>
          <button type="button" className="button button-secondary" onClick={clear} disabled={!hasFilters(applied) && !hasFilters(draft)}>Limpiar filtros</button>
        </div>
      </form>

      <section ref={results} aria-labelledby={`${id}-results`} aria-busy={loading}>
        <h2 id={`${id}-results`}>Rutas en operación</h2>
        {loading && !data ? <p role="status">Consultando rutas en operación…</p>
          : error ? <><p role="alert">{error}</p><button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar consulta</button></>
          : data && <>
            <p role="status">{data.total === 1 ? '1 ruta encontrada' : `${data.total} rutas encontradas`}{hasFilters(applied) ? ' con los filtros aplicados' : ''}.</p>
            {!data.items.length
              ? <p className="operations-empty">{hasFilters(applied) ? 'No existen operaciones que coincidan con los filtros aplicados. Ajusta o limpia los filtros para continuar.' : 'Todavía no hay rutas asignadas en operación.'}</p>
              : <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de rutas en operación"><table>
                <thead><tr><th scope="col">Conductor</th><th scope="col">Vehículo</th><th scope="col">Estado</th><th scope="col">Asignada</th><th scope="col">Progreso</th><th scope="col">No entregadas</th><th scope="col">Incidencias</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>{data.items.map(route => <tr key={route.ruta_id} aria-current={selected === route.ruta_id ? 'true' : undefined}>
                  <td>{route.conductor?.nombre_completo ?? 'Sin conductor'}</td>
                  <td>{route.version?.vehiculo.placa ?? 'No disponible'}</td>
                  <td><span className={`status-badge route-${route.estado.toLowerCase()}`}>{ROUTE_STATE_LABELS[route.estado]}</span></td>
                  <td>{formatDateTime(route.asignado_en)}</td>
                  <td>{route.deliveries.processed}/{route.deliveries.total} ({route.deliveries.percentage}%)</td>
                  <td>{route.deliveries.not_delivered}</td>
                  <td>{route.incidents}</td>
                  <td><button type="button" className="button button-secondary" aria-expanded={selected === route.ruta_id} aria-label={`Ver entregas de la ruta ${route.version?.vehiculo.placa ?? ''} de ${route.conductor?.nombre_completo ?? 'conductor sin asignar'}`.replace(/\s+/g, ' ')} data-route-id={route.ruta_id} onClick={() => setSelected(route.ruta_id)}>Ver entregas</button></td>
                </tr>)}</tbody>
              </table></div>}
            {data.total > data.pageSize && <nav className="driver-actions" aria-label="Paginación del seguimiento">
              <button type="button" className="button button-secondary" disabled={page <= 1} onClick={() => goTo(page - 1)}>Anterior</button>
              <span>Página {page} de {Math.ceil(data.total / data.pageSize)}</span>
              <button type="button" className="button button-secondary" disabled={page * data.pageSize >= data.total} onClick={() => goTo(page + 1)}>Siguiente</button>
            </nav>}
          </>}
      </section>
      {selected && <OperationRouteDetail routeId={selected} onClose={closeDetail} onUnauthorized={unauthorized} />}
    </section>
  </AppLayout>;
}
