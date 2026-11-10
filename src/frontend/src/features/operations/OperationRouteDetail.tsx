import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import { INCIDENT_TYPE_LABELS, type IncidentType } from '../../services/driver-profile-api';
import { DELIVERY_STATE_LABELS, ROUTE_STATE_LABELS, operationsApi, type OperationalRouteDetail } from '../../services/operations-api';
import { formatDateTime } from './format';

interface Props { routeId: string; onClose: () => void; onUnauthorized: () => void }

// US-019: detalle de solo lectura de las entregas de una ruta en operación.
export function OperationRouteDetail({ routeId, onClose, onUnauthorized }: Readonly<Props>) {
  const [detail, setDetail] = useState<OperationalRouteDetail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setDetail(null); setError('');
    operationsApi.detail(routeId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setDetail(value); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) onUnauthorized();
        else setError(cause instanceof Error ? cause.message : 'No se pudo consultar el detalle de la ruta.');
      });
    return () => controller.abort();
  }, [routeId, attempt, onUnauthorized]);

  useEffect(() => { heading.current?.focus(); }, [routeId]);

  return <section className="users-panel operations-detail" aria-labelledby="operations-detail-title">
    <div className="page-heading">
      <h2 id="operations-detail-title" ref={heading} tabIndex={-1}>Entregas de la ruta{detail ? ` · ${detail.version.vehiculo.placa}` : ''}</h2>
      <button type="button" className="button button-secondary" onClick={onClose}>Cerrar detalle</button>
    </div>
    {error ? <><p role="alert">{error}</p><button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></>
      : !detail ? <p role="status">Cargando entregas…</p>
      : <>
        <dl className="operations-facts">
          <div><dt>Estado</dt><dd>{ROUTE_STATE_LABELS[detail.estado]}</dd></div>
          <div><dt>Conductor</dt><dd>{detail.conductor?.nombre_completo ?? 'Sin conductor'}</dd></div>
          <div><dt>Asignada</dt><dd>{formatDateTime(detail.asignado_en)}</dd></div>
          <div><dt>Progreso</dt><dd>{detail.deliveries.processed}/{detail.deliveries.total} ({detail.deliveries.percentage}%)</dd></div>
          <div><dt>Incidencias</dt><dd>{detail.incidents}</dd></div>
        </dl>
        {!detail.stops.length ? <p>La ruta no tiene entregas registradas.</p> : <ol className="operations-stops">{detail.stops.map(stop => <li key={stop.parada_id}>
          <p><strong>Parada {stop.secuencia}</strong> · {stop.direccion ?? `Pedido ${stop.pedido_id}`}</p>
          <p><span className={`status-badge delivery-${stop.estado_entrega.toLowerCase()}`}>{DELIVERY_STATE_LABELS[stop.estado_entrega]}</span>{stop.atendido_en ? ` · Atendida: ${formatDateTime(stop.atendido_en)}` : ''}</p>
          {stop.causa_no_entrega && <p>Causa de no entrega: {stop.causa_no_entrega}</p>}
          {stop.incidencias.length > 0 && <ul className="delivery-incidents-list" aria-label={`Incidencias de la parada ${stop.secuencia}`}>{stop.incidencias.map(incident => <li key={incident.incidencia_id}>
            <strong>{INCIDENT_TYPE_LABELS[incident.tipo as IncidentType] ?? incident.tipo}</strong> · <time dateTime={incident.registrado_en}>{formatDateTime(incident.registrado_en)}</time>
            <p>{incident.descripcion}</p>
            {incident.detalle_complementario && <p>Información complementaria: {incident.detalle_complementario}</p>}
          </li>)}</ul>}
        </li>)}</ol>}
      </>}
  </section>;
}
