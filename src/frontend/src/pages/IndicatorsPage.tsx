import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { INCIDENT_TYPES, INCIDENT_TYPE_LABELS } from '../services/driver-profile-api';
import { indicatorsApi, type Indicators, type IndicatorsPeriod } from '../services/indicators-api';

// US-022 / RF-020: indicadores de la operación para Administrador y Operador / Técnico.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const INSUFFICIENT = 'Sin datos suficientes';

function periodFrom(params: URLSearchParams): IndicatorsPeriod {
  const desde = params.get('desde'); const hasta = params.get('hasta');
  return { ...(desde && DATE.test(desde) ? { desde } : {}), ...(hasta && DATE.test(hasta) ? { hasta } : {}) };
}

const number = (value: number, digits = 2) => value.toLocaleString('es-PE', { maximumFractionDigits: digits });
/** Valor de un indicador; null se muestra como «Sin datos suficientes», nunca como 0. */
export const show = (value: number | null | undefined, unit = '', digits = 2) => value === null ? INSUFFICIENT : value === undefined ? '…' : `${number(value, digits)}${unit}`;
const day = (value: string) => { const [year, month, date] = value.split('-'); return `${date}/${month}/${year}`; };

type Metric = readonly [label: string, value: string, detail?: string];

function MetricGrid({ title, metrics, loading }: Readonly<{ title: string; metrics: Metric[]; loading: boolean }>) {
  const id = useId();
  return <section className="admin-summary indicators-section" aria-labelledby={id}>
    <h2 id={id}>{title}</h2>
    <dl className="admin-metrics" aria-busy={loading}>{metrics.map(([label, value, detail]) => <div className="admin-metric" key={label}>
      <dt>{label}</dt>
      <dd className={value === INSUFFICIENT ? 'admin-metric-value-muted' : undefined}>{value}</dd>
      {detail && <dd className="admin-metric-value-muted">{detail}</dd>}
    </div>)}</dl>
  </section>;
}

export function IndicatorsPage() {
  const { acceptSession } = useAuth();
  const [params, setParams] = useSearchParams();
  const applied = periodFrom(params);
  const appliedKey = new URLSearchParams(applied as Record<string, string>).toString();
  const [draft, setDraft] = useState<IndicatorsPeriod>(applied);
  const [dateError, setDateError] = useState('');
  const [data, setData] = useState<Indicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const id = useId();
  const unauthorized = useCallback(() => acceptSession(null), [acceptSession]);

  // Mantiene el formulario alineado con la URL (Atrás/Adelante o enlaces compartidos).
  useEffect(() => { setDraft(periodFrom(new URLSearchParams(appliedKey))); setDateError(''); }, [appliedKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    indicatorsApi.get(periodFrom(new URLSearchParams(appliedKey)), controller.signal)
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) unauthorized();
        else { setData(null); setError(cause instanceof Error ? cause.message : 'No se pudieron consultar los indicadores.'); }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [appliedKey, attempt, unauthorized]);

  function apply(event: FormEvent) {
    event.preventDefault();
    if (draft.desde && draft.hasta && draft.desde > draft.hasta) { setDateError('La fecha «desde» no puede ser posterior a «hasta».'); return; }
    setDateError('');
    setParams(new URLSearchParams(draft as Record<string, string>));
    setAttempt(value => value + 1);
  }
  function reset() { setDraft({}); setDateError(''); setParams(new URLSearchParams()); }
  const set = (key: keyof IndicatorsPeriod, value: string) => setDraft(current => {
    const next = { ...current, [key]: value };
    if (!value) delete next[key];
    return next;
  });

  // Las tarjetas se pintan desde el inicio con «…» para reservar su espacio (CLS).
  const shown = loading ? null : data;
  const op = shown?.operacion; const sus = shown?.sostenibilidad;
  const operation: Metric[] = [
    ['Rutas completadas', show(op?.rutas_completadas, '', 0)],
    ['Entregas realizadas', show(op?.entregas.realizadas, '', 0)],
    ['Entregas no realizadas', show(op?.entregas.no_realizadas, '', 0)],
    ['Tasa de entregas exitosas', show(op?.entregas.tasa_exito, ' %'), 'Realizadas ÷ (realizadas + no realizadas)'],
    ['Incidencias registradas', show(op?.incidencias.total, '', 0)],
    ['Duración media de la ruta', show(op?.duracion_media_min, ' min'), 'Del inicio al fin de cada ruta'],
  ];
  const sustainability: Metric[] = [
    ['Cobertura del registro', show(sus?.cobertura, ' %'), sus ? `${sus.rutas_con_registro} de ${op?.rutas_completadas ?? 0} rutas con registro de sostenibilidad` : undefined],
    ['Distancia recorrida', show(sus?.distancia_km, ' km', 3)],
    ['Combustible consumido', show(sus?.combustible_l, ' L', 3)],
    ['Emisiones de CO₂', show(sus?.co2_kg, ' kg', 4)],
    ['CO₂ por entrega exitosa', show(sus?.co2_por_entrega_kg, ' kg', 4), 'Solo rutas con registro'],
    ['Costo de combustible', sus?.costo_combustible === undefined ? '…' : sus.costo_combustible === null ? INSUFFICIENT : `S/ ${number(sus.costo_combustible)}`, sus ? `${sus.registros_con_costo} registros informan el costo` : undefined],
    ['Origen de los datos', sus ? `${sus.origen.ESTIMADO} estimados · ${sus.origen.MEDIDO} medidos` : '…'],
  ];

  return <AppLayout title="Indicadores" navigationLabel="Indicadores de la operación">
    <section className="users-panel operations-panel" aria-labelledby="indicators-title">
      <div className="page-heading"><h1 id="indicators-title">Indicadores de la operación</h1></div>
      <p>Resultados de las rutas completadas en el periodo: entregas, incidencias, duración y sostenibilidad. Las rutas que siguen en curso se revisan en «Seguimiento operativo».</p>

      <form className="operations-filters" onSubmit={apply} aria-labelledby={`${id}-period`} noValidate>
        <h2 id={`${id}-period`}>Periodo</h2>
        <div className="operations-filter-grid">
          <label className="form-field">Desde
            <input type="date" value={draft.desde ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('desde', event.target.value)} />
          </label>
          <label className="form-field">Hasta
            <input type="date" value={draft.hasta ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('hasta', event.target.value)} />
          </label>
        </div>
        <p className="admin-metric-value-muted">Sin fechas se muestran los últimos 30 días. El periodo admite hasta 366 días, en hora de Lima.</p>
        {dateError && <p id={`${id}-date-error`} className="field-error" role="alert">{dateError}</p>}
        <div className="driver-actions">
          <button type="submit" className="button button-primary">Consultar periodo</button>
          <button type="button" className="button button-secondary" onClick={reset} disabled={!appliedKey && !draft.desde && !draft.hasta}>Últimos 30 días</button>
        </div>
      </form>

      {error ? <div className="indicators-error"><p role="alert">{error}</p><button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar consulta</button></div>
        : <>
          <p role="status">{loading || !data ? 'Calculando indicadores…'
            : `Periodo del ${day(data.periodo.desde)} al ${day(data.periodo.hasta)}.${data.datos_suficientes ? '' : ' No existen datos suficientes para presentar indicadores en este periodo: no hay rutas completadas.'}`}</p>
          <MetricGrid title="Operación" metrics={operation} loading={loading} />
          <MetricGrid title="Sostenibilidad" metrics={sustainability} loading={loading} />
          <section aria-labelledby={`${id}-incidents`} aria-busy={loading}>
            <h2 id={`${id}-incidents`}>Incidencias por tipo</h2>
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de incidencias por tipo"><table>
              <thead><tr><th scope="col">Tipo de incidencia</th><th scope="col">Cantidad</th></tr></thead>
              <tbody>{INCIDENT_TYPES.map(type => <tr key={type}><td>{INCIDENT_TYPE_LABELS[type]}</td><td>{op ? number(op.incidencias.por_tipo[type] ?? 0, 0) : '…'}</td></tr>)}</tbody>
            </table></div>
          </section>
        </>}
    </section>
  </AppLayout>;
}
