import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import { INCIDENT_TYPE_LABELS, type IncidentType } from '../../services/driver-profile-api';
import { historyApi, type HistoryDetail } from '../../services/history-api';
import { DELIVERY_STATE_LABELS } from '../../services/operations-api';
import { formatDateTime } from './format';

interface Props { routeId: string; onClose: () => void; onUnauthorized: () => void }

const decimal = (value: string, unit: string, digits = 4) => `${Number(value).toLocaleString('es-PE', { maximumFractionDigits: digits })} ${unit}`;
const SOURCE_LABELS = { ESTIMADO: 'Estimado a partir del cálculo', MEDIDO: 'Medido en la operación' } as const;

/** Línea de tiempo de la operación: quién hizo qué y cuándo, de la planificación al cierre. */
function timeline(detail: HistoryDetail) {
  return [
    ['Ruta generada', formatDateTime(detail.creado_en), `Planificación «${detail.planificacion.etiqueta}», versión ${detail.planificacion.version}`],
    ['Ruta confirmada', detail.confirmado_en ? formatDateTime(detail.confirmado_en) : 'Sin confirmación registrada',
      detail.confirmado_en ? `Por ${detail.confirmado_por ?? 'usuario no disponible'} · versión ${detail.version_confirmada ?? '—'}` : 'Ruta asignada antes de que existiera la confirmación (US-020)'],
    ['Conductor asignado', formatDateTime(detail.asignado_en), detail.conductor?.nombre_completo ?? 'Sin conductor'],
    ['Ruta iniciada', formatDateTime(detail.iniciado_en), `Vehículo ${detail.version.vehiculo.placa} (${detail.version.vehiculo.tipo})`],
    ['Ruta completada', formatDateTime(detail.finalizado_en), `${detail.entregas.realizadas} de ${detail.entregas.total} entregas realizadas · ${detail.incidencias} incidencias`],
  ] as const;
}

// US-023: trazabilidad completa y de solo lectura de una operación terminada.
export function HistoryOperationDetail({ routeId, onClose, onUnauthorized }: Readonly<Props>) {
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setDetail(null); setError('');
    historyApi.detail(routeId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setDetail(value); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) onUnauthorized();
        else setError(cause instanceof Error ? cause.message : 'No se pudo consultar el detalle de la operación.');
      });
    return () => controller.abort();
  }, [routeId, attempt, onUnauthorized]);

  useEffect(() => { heading.current?.focus(); }, [routeId]);

  const sustainability = detail?.sostenibilidad;
  return <section className="users-panel operations-detail" aria-labelledby="history-detail-title">
    <div className="page-heading">
      <h2 id="history-detail-title" ref={heading} tabIndex={-1}>Detalle de la operación{detail ? ` · ${detail.version.vehiculo.placa}` : ''}</h2>
      <button type="button" className="button button-secondary" onClick={onClose}>Cerrar detalle</button>
    </div>
    {error ? <><p role="alert">{error}</p><button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></>
      : !detail ? <p role="status">Cargando detalle…</p>
      : <>
        <h3>Trazabilidad</h3>
        <ol className="operations-stops history-timeline" aria-label="Línea de tiempo de la operación">{timeline(detail).map(([label, when, who]) => <li key={label}>
          <p><strong>{label}</strong> · {when}</p>
          <p>{who}</p>
        </li>)}</ol>

        <h3>Entregas e incidencias</h3>
        {!detail.paradas.length ? <p>La operación no tiene entregas registradas.</p> : <ol className="operations-stops">{detail.paradas.map(stop => <li key={stop.parada_id}>
          <p><strong>Parada {stop.secuencia}</strong> · {stop.direccion ?? `Pedido ${stop.pedido_id}`}</p>
          <p><span className={`status-badge delivery-${stop.estado_entrega.toLowerCase()}`}>{DELIVERY_STATE_LABELS[stop.estado_entrega]}</span>{stop.atendido_en ? ` · Atendida: ${formatDateTime(stop.atendido_en)}` : ''}</p>
          {stop.causa_no_entrega && <p>Causa de no entrega: {stop.causa_no_entrega}</p>}
          {stop.incidencias.length > 0 && <ul className="delivery-incidents-list" aria-label={`Incidencias de la parada ${stop.secuencia}`}>{stop.incidencias.map(incident => <li key={incident.incidencia_id}>
            <strong>{INCIDENT_TYPE_LABELS[incident.tipo as IncidentType] ?? incident.tipo}</strong> · <time dateTime={incident.registrado_en}>{formatDateTime(incident.registrado_en)}</time>
            <p>{incident.descripcion}</p>
            {incident.detalle_complementario && <p>Información complementaria: {incident.detalle_complementario}</p>}
          </li>)}</ul>}
        </li>)}</ol>}

        <h3>Sostenibilidad</h3>
        {!sustainability ? <p>Sin registro de sostenibilidad para esta operación.</p>
          : <dl className="operations-facts">
            <div><dt>Distancia</dt><dd>{decimal(sustainability.distancia_km, 'km', 3)}</dd></div>
            <div><dt>Combustible</dt><dd>{decimal(sustainability.combustible_l, 'L', 3)}</dd></div>
            <div><dt>Emisiones de CO₂</dt><dd>{decimal(sustainability.emisiones_co2_kg, 'kg')}</dd></div>
            <div><dt>Origen de los datos</dt><dd>{SOURCE_LABELS[sustainability.origen_datos] ?? sustainability.origen_datos}</dd></div>
            <div><dt>Costo de combustible</dt><dd>{sustainability.costo_combustible === null ? 'No informado' : `S/ ${decimal(sustainability.costo_combustible, '', 2).trim()}`}</dd></div>
            <div><dt>Registrado</dt><dd>{formatDateTime(sustainability.registrado_en)} · {sustainability.registrador?.email ?? 'usuario no disponible'}</dd></div>
            {sustainability.observaciones && <div><dt>Observaciones</dt><dd>{sustainability.observaciones}</dd></div>}
          </dl>}
      </>}
  </section>;
}
