import { useRef, useState, type SubmitEvent } from 'react';
import { ApiError } from '../../services/api';
import { routesApi } from '../../services/routes-api';
import type { RouteState, RouteSustainability, SustainabilitySource } from '../../types/routes';
import { checkSustainability, decimal, emissionsPreview, SOURCE_LABELS, SUSTAINABILITY_LABELS, sustainabilityProblem, type NumericField, type SustainabilityField, type SustainabilityForm } from './route-sustainability';

interface Props {
  routeId: string;
  routeState: RouteState;
  initial: SustainabilityForm;
  onRegistered: (result: RouteSustainability) => void;
  onReload: () => void;
  onSessionExpired: () => void;
}
interface PanelError { message: string; reload: boolean }

const date = (value: string) => new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' });

/** US-021: información de sostenibilidad ya registrada y asociada a la ruta. */
export function RouteSustainabilitySummary({ record }: Readonly<{ record: RouteSustainability }>) {
  const rows: [string, string][] = [
    ['Distancia recorrida', decimal(record.distancia_km, 'km')],
    ['Combustible consumido', decimal(record.combustible_l, 'L')],
    ['Factor de emisión', decimal(record.factor_emision_kg_co2_km, 'kg CO₂/km')],
    ['Emisiones de CO₂', decimal(record.emisiones_co2_kg, 'kg CO₂')],
    ['Origen de los datos', SOURCE_LABELS[record.origen_datos] ?? record.origen_datos],
    ['Costo de combustible', record.costo_combustible === null ? 'No informado' : `S/ ${Number(record.costo_combustible).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Observaciones', record.observaciones ?? 'Sin observaciones'],
    ['Vehículo', record.vehiculo.placa],
    ['Versión de ruta', String(record.ruta_version)],
    ['Registrado el', date(record.registrado_en)],
    ['Registrado por', record.registrador?.email ?? 'No disponible'],
  ];
  return <dl className="driver-detail">{rows.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>;
}

const NUMERIC_FIELDS: { field: NumericField; step: string; required: boolean }[] = [
  { field: 'distancia_km', step: '0.001', required: true },
  { field: 'combustible_l', step: '0.001', required: true },
  { field: 'factor_emision_kg_co2_km', step: '0.00001', required: true },
  { field: 'costo_combustible', step: '0.01', required: false },
];

/** US-021: el supervisor o planificador registra la información para evaluar la sostenibilidad de la ruta. */
export function RouteSustainabilityPanel({ routeId, routeState, initial, onRegistered, onReload, onSessionExpired }: Readonly<Props>) {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SustainabilityField, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PanelError>();
  const sending = useRef(false);
  const emissions = emissionsPreview(form);

  function update<K extends keyof SustainabilityForm>(field: K, value: SustainabilityForm[K]) {
    setForm(current => ({ ...current, [field]: value }));
    setFieldErrors(current => { const { [field as SustainabilityField]: removed, ...rest } = current; void removed; return rest; });
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const check = checkSustainability(form, routeState);
    if (!check.input) {
      setFieldErrors({ ...Object.fromEntries(check.missing.map(field => [field, 'Dato obligatorio.'])), ...check.invalid });
      setError({ message: `No se puede registrar. ${sustainabilityProblem(check)}`, reload: false });
      return;
    }
    sending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      onRegistered(await routesApi.registerSustainability(routeId, check.input)); // Tras el éxito la página recarga y muestra el registro.
    } catch (cause) {
      sending.current = false;
      setBusy(false);
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError({ message: cause instanceof Error && cause.message ? cause.message : 'No se pudo registrar la información de sostenibilidad.', reload: cause instanceof ApiError && cause.status === 409 });
    }
  }

  const describedBy = (field: SustainabilityField) => fieldErrors[field] ? `sustainability-${field}-error` : undefined;
  const fieldError = (field: SustainabilityField) => fieldErrors[field] && <span id={`sustainability-${field}-error`} className="field-error">{fieldErrors[field]}</span>;

  return <form className="route-assignment" noValidate onSubmit={event => void submit(event)} aria-busy={busy}>
    <fieldset disabled={busy}>
      <legend>Registrar sostenibilidad</legend>
      <p id="sustainability-hint">Los campos marcados con * son obligatorios. Se precargan con la distancia calculada y los datos del vehículo; corrígelos si tienes datos medidos.</p>
      {NUMERIC_FIELDS.map(({ field, step, required }) => <div key={field}>
        <label htmlFor={`sustainability-${field}`}>{SUSTAINABILITY_LABELS[field]}{required ? ' *' : ''}</label>
        <input id={`sustainability-${field}`} type="number" inputMode="decimal" min="0" step={step} value={form[field]} required={required} aria-required={required} aria-invalid={Boolean(fieldErrors[field])} aria-describedby={describedBy(field)} onChange={event => update(field, event.target.value)} />
        {fieldError(field)}
      </div>)}
      <div>
        <label htmlFor="sustainability-origen_datos">{SUSTAINABILITY_LABELS.origen_datos} *</label>
        <select id="sustainability-origen_datos" value={form.origen_datos} required aria-required aria-invalid={Boolean(fieldErrors.origen_datos)} aria-describedby={describedBy('origen_datos')} onChange={event => update('origen_datos', event.target.value as '' | SustainabilitySource)}>
          <option value="">Selecciona el origen</option>
          {(Object.keys(SOURCE_LABELS) as SustainabilitySource[]).map(source => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}
        </select>
        {fieldError('origen_datos')}
        {routeState !== 'COMPLETADA' && <p>Mientras la ruta no esté completada solo se pueden registrar datos estimados.</p>}
      </div>
      <div>
        <label htmlFor="sustainability-observaciones">Observaciones</label>
        <textarea id="sustainability-observaciones" maxLength={500} value={form.observaciones} onChange={event => update('observaciones', event.target.value)} />
      </div>
      <p>Emisiones estimadas: <output htmlFor="sustainability-distancia_km sustainability-factor_emision_kg_co2_km">{emissions === undefined ? 'Completa la distancia y el factor de emisión' : `${emissions} kg CO₂`}</output></p>
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Registrando…' : 'Registrar sostenibilidad'}</button>
    </fieldset>
    {error && <div role="alert"><p>{error.message}</p>{error.reload && <button type="button" className="button button-secondary" onClick={onReload}>Recargar ruta</button>}</div>}
  </form>;
}
