import { useRef, useState, type FormEvent } from 'react';
import { ORDER_PRIORITIES, PRODUCT_TYPES, type OrderValues, type RegisteredOrder } from '../../types/orders';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { DeliveryMap, type DeliveryPoint } from './DeliveryMap';
const initial = { nombre: '', direccion: '', referencia: '', descripcion_carga: '', ubicacion: '', peso_kg: '', volumen_m3: '', fecha_inicio: '', hora_inicio: '', fecha_fin: '', hora_fin: '', prioridad: '', tipo_producto: '' };
type Field = keyof typeof initial;
function decimal(value: string, scale: number, min: number, max: number) {
  return new RegExp(`^-?\\d+(?:\\.\\d{1,${scale}})?$`).test(value) && Number(value) >= min && Number(value) <= max;
}
export function OrderForm({ onSave }: { onSave: (values: OrderValues) => Promise<RegisteredOrder> }) {
  const [values, setValues] = useState(initial); const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [registered, setRegistered] = useState<RegisteredOrder | null>(null);
  const submitting = useRef(false);
  const [point, setPoint] = useState<DeliveryPoint | null>(null);
  const textFields: [Field, string, number][] = [['nombre', 'Nombre del cliente', 150], ['direccion', 'Dirección de entrega', 255]];
  const numericFields: [Field, string][] = [['peso_kg', 'Peso (kg)'], ['volumen_m3', 'Volumen (m³)']];
  const change = (field: Field, value: string) => {
    setValues(current => ({ ...current, [field]: value })); setError('');
    setErrors(current => { const next = { ...current }; delete next[field]; if (field === 'fecha_inicio' || field === 'hora_inicio' || field === 'fecha_fin') delete next.hora_fin; return next; });
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting.current || registered) return;
    const next: Partial<Record<Field, string>> = {};
    for (const [field, label, max] of textFields) if (!values[field].trim() || values[field].trim().length > max) next[field] = `${label}: obligatorio, máximo ${max} caracteres.`;
    if (!point || !Number.isFinite(point.latitud) || !Number.isFinite(point.longitud) || Math.abs(point.latitud) > 90 || Math.abs(point.longitud) > 180) next.ubicacion = 'Selecciona un punto de entrega válido en el mapa.';
    if (values.descripcion_carga.trim().length > 255) next.descripcion_carga = 'Descripción: máximo 255 caracteres.';
    if (!decimal(values.peso_kg, 2, 0.01, 99999999.99)) next.peso_kg = 'Peso: mayor que cero, hasta 8 enteros y 2 decimales.';
    if (values.volumen_m3.trim() && !decimal(values.volumen_m3, 3, 0.001, 9999999.999)) next.volumen_m3 = 'Volumen: mayor que cero, hasta 7 enteros y 3 decimales.';
    for (const edge of ['inicio', 'fin'] as const) {
      const date = values[`fecha_${edge}`]; const time = values[`hora_${edge}`];
      const parsedDate = new Date(`${date}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) next[`fecha_${edge}`] = `Selecciona una fecha de ${edge} válida.`;
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) next[`hora_${edge}`] = `Selecciona una hora de ${edge} válida.`;
    }
    // Lima is UTC-05:00. Preserve the chosen wall-clock time regardless of browser timezone.
    const start = `${values.fecha_inicio}T${values.hora_inicio}:00-05:00`;
    const end = `${values.fecha_fin}T${values.hora_fin}:00-05:00`;
    if (!next.fecha_inicio && !next.hora_inicio && !next.fecha_fin && !next.hora_fin && Date.parse(end) <= Date.parse(start)) next.hora_fin = 'El fin de la ventana de entrega debe ser posterior al inicio.';
    if (!ORDER_PRIORITIES.some(item => item === values.prioridad)) next.prioridad = 'Selecciona una prioridad permitida.';
    if (!PRODUCT_TYPES.some(item => item === values.tipo_producto)) next.tipo_producto = 'Selecciona un tipo de producto permitido.';
    setErrors(next); setError('');
    const first = Object.keys(next)[0]; if (first) { document.getElementById(`order-${first}`)?.focus(); return; }
    submitting.current = true; setLoading(true);
    try {
      const result = await onSave({ cliente: { nombre: values.nombre.trim(), direccion: values.direccion.trim(), ...(values.referencia.trim() ? { referencia: values.referencia.trim() } : {}), ...point! }, ...(values.descripcion_carga.trim() ? { descripcion_carga: values.descripcion_carga.trim() } : {}), peso_kg: Number(values.peso_kg), volumen_m3: values.volumen_m3.trim() ? Number(values.volumen_m3) : null, ventana_inicio: start, ventana_fin: end, prioridad: values.prioridad, tipo_producto: values.tipo_producto });
      setRegistered(result); setValues(initial); setPoint(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo registrar el pedido.'); }
    finally { submitting.current = false; setLoading(false); }
  }
  const attributes = (field: Field) => ({ id: `order-${field}`, value: values[field], 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `order-${field}-error` : undefined });
  const fieldError = (field: Field) => errors[field] && <p className="field-error" id={`order-${field}-error`}>{errors[field]}</p>;
  if (registered) return <div role="status"><h2>Pedido registrado correctamente</h2><p>Código: {registered.pedido_id}</p><p>Estado: Pendiente</p><button className="button button-primary" onClick={() => { setRegistered(null); setErrors({}); }}>Registrar otro pedido</button></div>;
  return <form className="login-form order-form" aria-label="Registrar pedido" noValidate onSubmit={submit}>
    <fieldset disabled={loading}><legend>Cliente</legend>
      <div className="form-field"><label htmlFor="order-nombre">Nombre del cliente</label><input {...attributes('nombre')} maxLength={150} onChange={event => change('nombre', event.target.value)} />{fieldError('nombre')}</div>
    </fieldset>
    <fieldset disabled={loading}><legend>Ubicación de entrega</legend>
      <div className="form-field"><label htmlFor="order-direccion">Dirección de entrega</label><input {...attributes('direccion')} maxLength={255} onChange={event => change('direccion', event.target.value)} />{fieldError('direccion')}</div>
      <div className="form-field"><label htmlFor="order-referencia">Referencia (opcional)</label><input {...attributes('referencia')} maxLength={255} onChange={event => change('referencia', event.target.value)} /></div>
      <DeliveryMap disabled={loading} onChange={selected => { setPoint(selected); change('ubicacion', 'seleccionada'); }} />{fieldError('ubicacion')}
    </fieldset>
    <fieldset disabled={loading}><legend>Información de la carga</legend>
      <div className="form-field"><label htmlFor="order-descripcion_carga">Descripción de carga</label><input {...attributes('descripcion_carga')} maxLength={255} onChange={event => change('descripcion_carga', event.target.value)} />{fieldError('descripcion_carga')}</div>
      {numericFields.map(([field, label]) => <div className="form-field" key={field}><label htmlFor={`order-${field}`}>{label}{field === 'volumen_m3' && ' — opcional'}</label><input {...attributes(field)} aria-describedby={field === 'volumen_m3' ? `order-volume-help${errors[field] ? ' order-volumen_m3-error' : ''}` : attributes(field)['aria-describedby']} inputMode="decimal" autoComplete="off" onChange={event => change(field, event.target.value)} />{fieldError(field)}</div>)}
      <p id="order-volume-help">Opcional. Complete este campo solo si conoce el volumen aproximado de la carga.</p>
    </fieldset>
    <fieldset disabled={loading}><legend>Entrega</legend>
      <p className="access-note">Horario de entrega: America/Lima (UTC−05:00).</p>
      {(['inicio', 'fin'] as const).map(edge => <fieldset className="delivery-window" key={edge}><legend>{edge === 'inicio' ? 'Inicio de ventana de entrega' : 'Fin de ventana de entrega'}</legend>
        <div className="delivery-window-inputs">{(['fecha', 'hora'] as const).map(part => {
          const field = `${part}_${edge}` as const;
          return <div className="form-field" key={field}><label htmlFor={`order-${field}`}>{part === 'fecha' ? 'Fecha' : 'Hora'} de {edge}</label><input {...attributes(field)} type={part === 'fecha' ? 'date' : 'time'} step={part === 'hora' ? 60 : undefined} onChange={event => change(field, event.target.value)} />{fieldError(field)}</div>;
        })}</div>
      </fieldset>)}
      <div className="form-field"><label htmlFor="order-prioridad">Prioridad</label><select {...attributes('prioridad')} onChange={event => change('prioridad', event.target.value)}><option value="">Selecciona una prioridad</option>{ORDER_PRIORITIES.map(item => <option key={item} value={item}>{item === 'ESTANDAR' ? 'Estándar' : item === 'ECONOMICO' ? 'Económico' : 'Express'}</option>)}</select>{fieldError('prioridad')}</div>
      <div className="form-field"><label htmlFor="order-tipo_producto">Tipo de producto</label><select {...attributes('tipo_producto')} onChange={event => change('tipo_producto', event.target.value)}><option value="">Selecciona un tipo</option>{PRODUCT_TYPES.map(item => <option key={item} value={item}>{item === 'PERECEDERO' ? 'Perecedero' : 'No perecedero'}</option>)}</select>{fieldError('tipo_producto')}</div>
    </fieldset>
    {error && <ErrorMessage message={error} />}<LoadingButton type="submit" loading={loading} loadingLabel="Registrando pedido…">Registrar pedido</LoadingButton>
  </form>;
}
