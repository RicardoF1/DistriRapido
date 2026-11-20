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

type Tone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
interface Metric { label: string; value: string; detail?: string; icon: string; tone: Tone; percent?: number | null }

/** Tarjetas de indicadores: icono y color por tipo (CSS) y barra de progreso para los porcentajes. */
function MetricGrid({ title, subtitle, variant, metrics, loading }: Readonly<{ title: string; subtitle: string; variant: 'ops' | 'sus'; metrics: Metric[]; loading: boolean }>) {
  const id = useId();
  return <section className="indicators-section" aria-labelledby={id}>
    <div className="section-head"><h2 id={id}>{title}</h2><p>{subtitle}</p></div>
    <dl className={`admin-metrics kpi-grid kpi-grid-${variant}`} aria-busy={loading}>{metrics.map(({ label, value, detail, icon, tone, percent }) => <div className={`admin-metric kpi kpi-${tone} kpi-icon-${icon}`} key={label}>
      <dt>{label}</dt>
      <dd className={value === INSUFFICIENT ? 'admin-metric-value-muted' : undefined}>{value}</dd>
      {percent !== undefined && <dd className="kpi-bar" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, percent ?? 0))}%` }} /></dd>}
      {detail && <dd className="admin-metric-value-muted kpi-detail">{detail}</dd>}
    </div>)}</dl>
  </section>;
}

const limaToday = () => new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);
const shiftDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

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
  function preset(desde: string, hasta: string) { setDraft({ desde, hasta }); setDateError(''); setParams(new URLSearchParams({ desde, hasta })); }
  const set = (key: keyof IndicatorsPeriod, value: string) => setDraft(current => {
    const next = { ...current, [key]: value };
    if (!value) delete next[key];
    return next;
  });

  // Las tarjetas se pintan desde el inicio con «…» para reservar su espacio (CLS).
  const shown = loading ? null : data;
  const op = shown?.operacion; const sus = shown?.sostenibilidad;
  const operation: Metric[] = [
    { label: 'Rutas completadas', value: show(op?.rutas_completadas, '', 0), icon: 'route', tone: 'brand' },
    { label: 'Entregas realizadas', value: show(op?.entregas.realizadas, '', 0), icon: 'check', tone: 'success' },
    { label: 'Entregas no realizadas', value: show(op?.entregas.no_realizadas, '', 0), icon: 'cross', tone: 'danger' },
    { label: 'Tasa de entregas exitosas', value: show(op?.entregas.tasa_exito, ' %'), detail: 'Realizadas ÷ (realizadas + no realizadas)', icon: 'gauge', tone: 'success', percent: op ? op.entregas.tasa_exito : undefined },
    { label: 'Incidencias registradas', value: show(op?.incidencias.total, '', 0), icon: 'alert', tone: 'warning' },
    { label: 'Duración media de la ruta', value: show(op?.duracion_media_min, ' min'), detail: 'Del inicio al fin de cada ruta', icon: 'clock', tone: 'info' },
  ];
  const sustainability: Metric[] = [
    { label: 'Cobertura del registro', value: show(sus?.cobertura, ' %'), detail: sus ? `${sus.rutas_con_registro} de ${op?.rutas_completadas ?? 0} rutas con registro de sostenibilidad` : undefined, icon: 'leaf', tone: 'brand', percent: sus ? sus.cobertura : undefined },
    { label: 'Distancia recorrida', value: show(sus?.distancia_km, ' km', 3), icon: 'route', tone: 'info' },
    { label: 'Combustible consumido', value: show(sus?.combustible_l, ' L', 3), icon: 'fuel', tone: 'warning' },
    { label: 'Emisiones de CO₂', value: show(sus?.co2_kg, ' kg', 4), icon: 'cloud', tone: 'neutral' },
    { label: 'CO₂ por entrega exitosa', value: show(sus?.co2_por_entrega_kg, ' kg', 4), detail: 'Solo rutas con registro', icon: 'leaf', tone: 'success' },
    { label: 'Costo de combustible', value: sus?.costo_combustible === undefined ? '…' : sus.costo_combustible === null ? INSUFFICIENT : `S/ ${number(sus.costo_combustible)}`, detail: sus ? `${sus.registros_con_costo} registros informan el costo` : undefined, icon: 'coin', tone: 'warning' },
    { label: 'Origen de los datos', value: sus ? `${sus.origen.ESTIMADO} estimados · ${sus.origen.MEDIDO} medidos` : '…', icon: 'database', tone: 'neutral' },
  ];
  const maxIncidents = op ? Math.max(1, ...INCIDENT_TYPES.map(type => op.incidencias.por_tipo[type] ?? 0)) : 1;
  const today = limaToday();

  const deliveries = op?.entregas;
  const deliveryTotal = deliveries ? deliveries.realizadas + deliveries.no_realizadas + deliveries.pendientes : 0;
  const share = (part: number) => deliveryTotal ? Math.round(part * 1000 / deliveryTotal) / 10 : 0;
  const month = `${today.slice(0, 8)}01`;
  const week = shiftDays(today, -6);

  return <AppLayout title="Indicadores" navigationLabel="Indicadores de la operación">
    <section className="users-panel dashboard" aria-labelledby="indicators-title">
      <div className="dashboard-head">
        <h1 id="indicators-title">Indicadores de la operación</h1>
        <p className="dashboard-subtitle">Resultados de las rutas completadas en el periodo: entregas, incidencias, duración y sostenibilidad. Las rutas que siguen en curso se revisan en «Seguimiento operativo».</p>
      </div>

      <form className="period-toolbar" onSubmit={apply} aria-labelledby={`${id}-period`} noValidate>
        <div className="period-toolbar-row">
          <h2 id={`${id}-period`} className="period-title">Periodo</h2>
          <div className="period-presets" role="group" aria-label="Periodos rápidos">
            <button type="button" className="period-preset" aria-pressed={!appliedKey} onClick={reset}>Últimos 30 días</button>
            <button type="button" className="period-preset" aria-pressed={applied.desde === week && applied.hasta === today} onClick={() => preset(week, today)}>Últimos 7 días</button>
            <button type="button" className="period-preset" aria-pressed={applied.desde === month && applied.hasta === today} onClick={() => preset(month, today)}>Este mes</button>
          </div>
          <div className="period-range">
            <label className="period-field">Desde
              <input type="date" value={draft.desde ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('desde', event.target.value)} />
            </label>
            <label className="period-field">Hasta
              <input type="date" value={draft.hasta ?? ''} aria-invalid={dateError ? true : undefined} aria-describedby={dateError ? `${id}-date-error` : undefined} onChange={event => set('hasta', event.target.value)} />
            </label>
            <button type="submit" className="button button-primary">Consultar periodo</button>
          </div>
        </div>
        {dateError && <p id={`${id}-date-error`} className="field-error" role="alert">{dateError}</p>}
        <p className="period-hint">Sin fechas se muestran los últimos 30 días. Días completos en hora de Lima; el periodo admite hasta 366 días.</p>
      </form>

      {error ? <div className="indicators-error"><p role="alert">{error}</p><button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar consulta</button></div>
        : <>
          <p role="status" className={`period-status${data && !loading && !data.datos_suficientes ? ' is-empty' : ''}`}>{loading || !data ? 'Calculando indicadores…'
            : `Periodo del ${day(data.periodo.desde)} al ${day(data.periodo.hasta)}.${data.datos_suficientes ? '' : ' No existen datos suficientes para presentar indicadores en este periodo: no hay rutas completadas.'}`}</p>
          <MetricGrid title="Operación" subtitle="Rutas completadas en el periodo" variant="ops" metrics={operation} loading={loading} />
          <div className="dashboard-row">
            <section className="dashboard-card" aria-labelledby={`${id}-incidents`} aria-busy={loading}>
              <div className="section-head"><h2 id={`${id}-incidents`}>Incidencias por tipo</h2><p>Registradas por los conductores en sus entregas</p></div>
              <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de incidencias por tipo"><table className="compact-table">
                <thead><tr><th scope="col">Tipo de incidencia</th><th scope="col">Cantidad</th></tr></thead>
                <tbody>{INCIDENT_TYPES.map(type => <tr key={type}><td>{INCIDENT_TYPE_LABELS[type]}</td><td><span className="bar-cell"><span className="bar-track" aria-hidden="true"><span className="bar-fill" style={{ width: `${op ? Math.round((op.incidencias.por_tipo[type] ?? 0) * 100 / maxIncidents) : 0}%` }} /></span><span className="bar-value">{op ? number(op.incidencias.por_tipo[type] ?? 0, 0) : '…'}</span></span></td></tr>)}</tbody>
              </table></div>
            </section>
            <section className="dashboard-card" aria-labelledby={`${id}-deliveries`} aria-busy={loading}>
              <div className="section-head"><h2 id={`${id}-deliveries`}>Distribución de entregas</h2><p>Resultado de las paradas de las rutas completadas</p></div>
              <div className="stacked-bar" aria-hidden="true">
                {deliveries && deliveryTotal > 0 && <>
                  <span className="stacked-ok" style={{ width: `${share(deliveries.realizadas)}%` }} />
                  <span className="stacked-fail" style={{ width: `${share(deliveries.no_realizadas)}%` }} />
                  <span className="stacked-pending" style={{ width: `${share(deliveries.pendientes)}%` }} />
                </>}
              </div>
              <ul className="stacked-legend">
                <li><span className="legend-dot stacked-ok" aria-hidden="true" />Realizadas<strong>{deliveries ? number(deliveries.realizadas, 0) : '…'}</strong><small>{deliveryTotal ? `${number(share(deliveries!.realizadas), 1)} %` : '—'}</small></li>
                <li><span className="legend-dot stacked-fail" aria-hidden="true" />No realizadas<strong>{deliveries ? number(deliveries.no_realizadas, 0) : '…'}</strong><small>{deliveryTotal ? `${number(share(deliveries!.no_realizadas), 1)} %` : '—'}</small></li>
                <li><span className="legend-dot stacked-pending" aria-hidden="true" />Pendientes<strong>{deliveries ? number(deliveries.pendientes, 0) : '…'}</strong><small>{deliveryTotal ? `${number(share(deliveries!.pendientes), 1)} %` : '—'}</small></li>
              </ul>
              {deliveries && deliveryTotal === 0 && <p className="card-empty">Sin entregas en el periodo seleccionado.</p>}
            </section>
          </div>
          <MetricGrid title="Sostenibilidad" subtitle="Datos ambientales registrados por ruta" variant="sus" metrics={sustainability} loading={loading} />
        </>}
    </section>
  </AppLayout>;
}
