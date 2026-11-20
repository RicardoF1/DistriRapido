import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { historyApi, type HistoryFilters, type HistoryPage as Page } from '../services/history-api';
import { HistoryOperationDetail } from '../features/operations/HistoryOperationDetail';
import { formatDateTime } from '../features/operations/format';

// US-023 / RF-021: historial de operaciones terminadas para Administrador y Operador / Técnico.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const NO_RECORDS = 'No existen registros para los criterios seleccionados. Ajusta o limpia los filtros para continuar.';

function filtersFrom(params: URLSearchParams): HistoryFilters {
  const desde = params.get('desde'); const hasta = params.get('hasta'); const search = params.get('search')?.trim();
  return {
    ...(desde && DATE.test(desde) ? { desde } : {}),
    ...(hasta && DATE.test(hasta) ? { hasta } : {}),
    ...(search ? { search: search.slice(0, 100) } : {}),
    ...(params.get('con_incidencias') === 'true' ? { con_incidencias: true } : {}),
    ...(params.get('con_no_entregas') === 'true' ? { con_no_entregas: true } : {}),
  };
}

function paramsFrom(filters: HistoryFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.desde) params.set('desde', filters.desde);
  if (filters.hasta) params.set('hasta', filters.hasta);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.con_incidencias) params.set('con_incidencias', 'true');
  if (filters.con_no_entregas) params.set('con_no_entregas', 'true');
  if (page > 1) params.set('page', String(page));
  return params;
}

const hasFilters = (filters: HistoryFilters) => Object.keys(filters).length > 0;

export function HistoryPage() {
  const { acceptSession } = useAuth();
  const [params, setParams] = useSearchParams();
  const applied = filtersFrom(params);
  const appliedKey = paramsFrom(applied, 1).toString();
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const [draft, setDraft] = useState<HistoryFilters>(applied);
  const [dateError, setDateError] = useState('');
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
    setLoading(true); setError('');
    historyApi.list(filtersFrom(new URLSearchParams(appliedKey)), page, controller.signal)
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) unauthorized();
        else { setData(null); setError(cause instanceof Error ? cause.message : 'No se pudo consultar el historial.'); }
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
  // Al cerrar el detalle, el foco vuelve al botón «Ver detalle» de la misma operación.
  useEffect(() => {
    if (selected || !returnFocusTo.current) return;
    const routeId = returnFocusTo.current; returnFocusTo.current = null;
    results.current?.querySelector<HTMLButtonElement>(`button[data-route-id="${CSS.escape(routeId)}"]`)?.focus();
  }, [selected]);
  const set = <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => setDraft(current => {
    const next = { ...current, [key]: value };
    if (value === undefined || value === '' || value === false) delete next[key];
    return next;
  });

  return <AppLayout title="Historial" navigationLabel="Historial de operaciones">
    <section className="users-panel operations-panel" aria-labelledby="history-title">
      <div className="page-heading"><h1 id="history-title">Historial de operaciones</h1></div>
      <p>Revisa las operaciones terminadas con su trazabilidad completa: planificación, confirmación, asignación, entregas, incidencias y sostenibilidad. Las rutas en curso se siguen en «Seguimiento operativo».</p>

      <form className="operations-filters" onSubmit={apply} aria-labelledby={`${id}-filters`} noValidate>
        <h2 id={`${id}-filters`}>Filtros</h2>
        <div className="operations-filter-grid">
          <label className="form-field">Finalizada desde
            <input type="date" value={draft.desde ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('desde', event.target.value || undefined)} />
          </label>
          <label className="form-field">Finalizada hasta
            <input type="date" value={draft.hasta ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('hasta', event.target.value || undefined)} />
          </label>
          <label className="form-field">Placa o conductor
            <input type="search" value={draft.search ?? ''} maxLength={100} onChange={event => set('search', event.target.value || undefined)} />
          </label>
          <label className="operations-checkbox"><input type="checkbox" checked={draft.con_incidencias ?? false} onChange={event => set('con_incidencias', event.target.checked || undefined)} /> Solo con incidencias</label>
          <label className="operations-checkbox"><input type="checkbox" checked={draft.con_no_entregas ?? false} onChange={event => set('con_no_entregas', event.target.checked || undefined)} /> Solo con entregas no realizadas</label>
        </div>
        {dateError && <p id={`${id}-date-error`} className="field-error" role="alert">{dateError}</p>}
        <div className="driver-actions">
          <button type="submit" className="button button-primary">Aplicar filtros</button>
          <button type="button" className="button button-secondary" onClick={clear} disabled={!hasFilters(applied) && !hasFilters(draft)}>Limpiar filtros</button>
        </div>
      </form>

      <section ref={results} aria-labelledby={`${id}-results`} aria-busy={loading}>
        <h2 id={`${id}-results`}>Operaciones terminadas</h2>
        {loading && !data ? <p role="status">Consultando el historial…</p>
          : error ? <><p role="alert">{error}</p><button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar consulta</button></>
          : data && <>
            <p role="status">{data.total === 1 ? '1 operación encontrada' : `${data.total} operaciones encontradas`}{hasFilters(applied) ? ' con los filtros aplicados' : ''}.</p>
            {!data.items.length
              ? <p className="operations-empty">{hasFilters(applied) ? NO_RECORDS : 'Todavía no hay operaciones terminadas registradas.'}</p>
              : <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla del historial de operaciones"><table>
                <thead><tr><th scope="col">Finalizada</th><th scope="col">Planificación</th><th scope="col">Conductor</th><th scope="col">Vehículo</th><th scope="col">Entregas</th><th scope="col">No realizadas</th><th scope="col">Incidencias</th><th scope="col">Sostenibilidad</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>{data.items.map(item => <tr key={item.ruta_id} aria-current={selected === item.ruta_id ? 'true' : undefined}>
                  <td>{formatDateTime(item.finalizado_en)}</td>
                  <td>{item.planificacion.etiqueta}</td>
                  <td>{item.conductor?.nombre_completo ?? 'Sin conductor'}</td>
                  <td>{item.vehiculo?.placa ?? 'No disponible'}</td>
                  <td>{item.entregas.realizadas}/{item.entregas.total}</td>
                  <td>{item.entregas.no_realizadas}</td>
                  <td>{item.incidencias}</td>
                  <td>{item.con_sostenibilidad ? 'Registrada' : 'Sin registro'}</td>
                  <td><button type="button" className="button button-secondary" aria-expanded={selected === item.ruta_id} aria-label={`Ver detalle de la operación ${item.vehiculo?.placa ?? ''} finalizada el ${formatDateTime(item.finalizado_en)}`.replace(/\s+/g, ' ')} data-route-id={item.ruta_id} onClick={() => setSelected(current => current === item.ruta_id ? null : item.ruta_id)}>Ver detalle</button></td>
                </tr>)}</tbody>
              </table></div>}
            {data.total > data.pageSize && <nav className="driver-actions" aria-label="Paginación del historial">
              <button type="button" className="button button-secondary" disabled={page <= 1} onClick={() => goTo(page - 1)}>Anterior</button>
              <span>Página {page} de {Math.ceil(data.total / data.pageSize)}</span>
              <button type="button" className="button button-secondary" disabled={page * data.pageSize >= data.total} onClick={() => goTo(page + 1)}>Siguiente</button>
            </nav>}
          </>}
      </section>
      {selected && <HistoryOperationDetail routeId={selected} onClose={closeDetail} onUnauthorized={unauthorized} />}
    </section>
  </AppLayout>;
}
