import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../services/api';
import { driverProfileApi, INCIDENT_TYPE_LABELS, INCIDENT_TYPES, type DeliveryIncident, type IncidentType } from '../../services/driver-profile-api';

// US-018 / RF-015: registro y consulta de incidencias de una entrega propia.
type Field = 'tipo' | 'descripcion' | 'detalle_complementario';
type FieldErrors = Partial<Record<Field, string>>;
const MAX_TEXT = 500;
const FIELDS: readonly Field[] = ['tipo', 'descripcion', 'detalle_complementario'];
const formatDate = (value: string) => new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' });
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function validate(tipo: string, descripcion: string, detalle: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!tipo) errors.tipo = 'Selecciona el tipo de incidencia.';
  else if (!(INCIDENT_TYPES as readonly string[]).includes(tipo)) errors.tipo = 'El tipo de incidencia no es válido.';
  if (!descripcion.trim()) errors.descripcion = 'Describe la incidencia.';
  else if (descripcion.trim().length > MAX_TEXT) errors.descripcion = `La descripción admite como máximo ${MAX_TEXT} caracteres.`;
  if (detalle.trim().length > MAX_TEXT) errors.detalle_complementario = `La información complementaria admite como máximo ${MAX_TEXT} caracteres.`;
  return errors;
}

// The backend answers validation failures with one «campo: detalle» line per field.
function serverFieldErrors(message: string): FieldErrors | null {
  const errors: FieldErrors = {};
  for (const line of message.split('\n')) {
    const match = /^(tipo|descripcion|detalle_complementario):\s*(.+)$/.exec(line.trim());
    if (match) errors[match[1] as Field] ??= capitalize(match[2]);
  }
  return Object.keys(errors).length ? errors : null;
}

interface DeliveryIncidentsProps {
  deliveryId: string;
  sequence: number;
  incidents: DeliveryIncident[];
  canRegister: boolean;
  onRegistered: (incident: DeliveryIncident) => void;
  onUnauthorized: () => void;
}

export function DeliveryIncidents({ deliveryId, sequence, incidents, canRegister, onRegistered, onUnauthorized }: Readonly<DeliveryIncidentsProps>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<IncidentType | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [detalle, setDetalle] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const refs = { tipo: useRef<HTMLSelectElement>(null), descripcion: useRef<HTMLTextAreaElement>(null), detalle_complementario: useRef<HTMLTextAreaElement>(null) };
  const toggleRef = useRef<HTMLButtonElement>(null);
  const formId = `${id}-form`;
  const fieldId = (field: Field) => `${id}-${field}`;
  const errorId = (field: Field) => `${id}-${field}-error`;

  const returnFocus = useRef(false);
  useEffect(() => {
    if (open) refs.tipo.current?.focus();
    else if (returnFocus.current) { returnFocus.current = false; toggleRef.current?.focus(); }
    // refs are stable; only react to opening/closing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() { setTipo(''); setDescripcion(''); setDetalle(''); setErrors({}); setFailure(''); }
  function close() { reset(); returnFocus.current = true; setOpen(false); }
  function showErrors(next: FieldErrors) {
    setErrors(next);
    const first = FIELDS.find(field => next[field]);
    if (first) refs[first].current?.focus();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFailure('');
    const next = validate(tipo, descripcion, detalle);
    if (Object.keys(next).length) { showErrors(next); return; }
    setErrors({}); setSaving(true);
    try {
      const extra = detalle.trim();
      const result = await driverProfileApi.createIncident(deliveryId, { tipo: tipo as IncidentType, descripcion: descripcion.trim(), ...(extra ? { detalle_complementario: extra } : {}) });
      onRegistered(result.incidencia);
      close();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) { onUnauthorized(); return; }
      const message = cause instanceof Error ? cause.message : 'No se pudo registrar la incidencia.';
      const fieldErrors = cause instanceof ApiError && cause.status === 400 ? serverFieldErrors(message) : null;
      if (fieldErrors) showErrors(fieldErrors); else setFailure(message);
    } finally { setSaving(false); }
  }

  const describedBy = (field: Field, hint?: string) => [hint, errors[field] ? errorId(field) : undefined].filter(Boolean).join(' ') || undefined;

  return <div className="delivery-incidents">
    {incidents.length > 0 && <section aria-labelledby={`${id}-list-title`}>
      <h3 id={`${id}-list-title`} className="delivery-incidents-title">Incidencias registradas ({incidents.length})</h3>
      <ul className="delivery-incidents-list">{incidents.map(incident => <li key={incident.incidencia_id}>
        <strong>{INCIDENT_TYPE_LABELS[incident.tipo] ?? incident.tipo}</strong> · <time dateTime={incident.registrado_en}>{formatDate(incident.registrado_en)}</time>
        <p>{incident.descripcion}</p>
        {incident.detalle_complementario && <p>Información complementaria: {incident.detalle_complementario}</p>}
      </li>)}</ul>
    </section>}
    {canRegister && <>
      {!open && <button ref={toggleRef} type="button" className="button button-secondary" aria-expanded={false} aria-controls={formId} onClick={() => setOpen(true)}>Registrar incidencia</button>}
      {open && <form id={formId} className="delivery-incident-form" noValidate onSubmit={event => void submit(event)} aria-label={`Registrar incidencia de la parada ${sequence}`}>
        <fieldset disabled={saving}>
          <legend>Nueva incidencia · Parada {sequence}</legend>
          <p className="delivery-incident-hint">Los campos marcados con * son obligatorios.</p>
          <div className="form-field">
            <label htmlFor={fieldId('tipo')}>Tipo de incidencia *</label>
            <select ref={refs.tipo} id={fieldId('tipo')} value={tipo} required aria-invalid={errors.tipo ? true : undefined} aria-describedby={describedBy('tipo')} onChange={event => setTipo(event.target.value as IncidentType | '')}>
              <option value="">Selecciona un tipo</option>
              {INCIDENT_TYPES.map(type => <option key={type} value={type}>{INCIDENT_TYPE_LABELS[type]}</option>)}
            </select>
            {errors.tipo && <p id={errorId('tipo')} className="field-error">{errors.tipo}</p>}
          </div>
          <div className="form-field">
            <label htmlFor={fieldId('descripcion')}>Descripción *</label>
            <textarea ref={refs.descripcion} id={fieldId('descripcion')} rows={3} maxLength={MAX_TEXT} value={descripcion} required aria-invalid={errors.descripcion ? true : undefined} aria-describedby={describedBy('descripcion')} onChange={event => setDescripcion(event.target.value)} />
            {errors.descripcion && <p id={errorId('descripcion')} className="field-error">{errors.descripcion}</p>}
          </div>
          <div className="form-field">
            <label htmlFor={fieldId('detalle_complementario')}>Información complementaria (opcional)</label>
            <textarea ref={refs.detalle_complementario} id={fieldId('detalle_complementario')} rows={2} maxLength={MAX_TEXT} value={detalle} aria-invalid={errors.detalle_complementario ? true : undefined} aria-describedby={describedBy('detalle_complementario', `${id}-extra-hint`)} onChange={event => setDetalle(event.target.value)} />
            <p id={`${id}-extra-hint`} className="delivery-incident-hint">Por ejemplo, una referencia, un desvío o con quién se habló.</p>
            {errors.detalle_complementario && <p id={errorId('detalle_complementario')} className="field-error">{errors.detalle_complementario}</p>}
          </div>
        </fieldset>
        {failure && <p role="alert" className="field-error">{failure}</p>}
        <div className="driver-actions">
          <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar incidencia'}</button>
          <button type="button" className="button button-secondary" disabled={saving} onClick={close}>Cancelar</button>
        </div>
      </form>}
    </>}
  </div>;
}
