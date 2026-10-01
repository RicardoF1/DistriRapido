import { useRef, useState, type FormEvent } from 'react';
import { ORDER_PRIORITIES, PRODUCT_TYPES, type OrderValues, type RegisteredOrder } from '../../types/orders';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingButton } from '../../components/ui/LoadingButton';
const initial = { nombre: '', direccion: '', latitud: '', longitud: '', peso_kg: '', volumen_m3: '', ventana_inicio: '', ventana_fin: '', prioridad: '', tipo_producto: '' };
type Field = keyof typeof initial;
function decimal(value: string, scale: number, min: number, max: number) {
  return new RegExp(`^-?\\d+(?:\\.\\d{1,${scale}})?$`).test(value) && Number(value) >= min && Number(value) <= max;
}
export function OrderForm({ onSave }: { onSave: (values: OrderValues) => Promise<RegisteredOrder> }) {
  const [values, setValues] = useState(initial); const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [registered, setRegistered] = useState<RegisteredOrder | null>(null);
  const submitting = useRef(false);
  const textFields: [Field, string, number][] = [['nombre', 'Nombre del cliente', 150], ['direccion', 'Dirección de entrega', 255]];
  const numericFields: [Field, string][] = [['latitud', 'Latitud'], ['longitud', 'Longitud'], ['peso_kg', 'Peso (kg)'], ['volumen_m3', 'Volumen (m³)']];
  const change = (field: Field, value: string) => {
    setValues(current => ({ ...current, [field]: value })); setError('');
    setErrors(current => { const next = { ...current }; delete next[field]; if (field === 'ventana_inicio') delete next.ventana_fin; return next; });
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting.current || registered) return;
    const next: Partial<Record<Field, string>> = {};
    for (const [field, label, max] of textFields) if (!values[field].trim() || values[field].trim().length > max) next[field] = `${label}: obligatorio, máximo ${max} caracteres.`;
    if (!decimal(values.latitud, 6, -90, 90)) next.latitud = 'Latitud: entre -90 y 90, hasta 6 decimales.';
    if (!decimal(values.longitud, 6, -180, 180)) next.longitud = 'Longitud: entre -180 y 180, hasta 6 decimales.';
    if (!decimal(values.peso_kg, 2, 0.01, 99999999.99)) next.peso_kg = 'Peso: mayor que cero, hasta 8 enteros y 2 decimales.';
    if (!decimal(values.volumen_m3, 3, 0.001, 9999999.999)) next.volumen_m3 = 'Volumen: mayor que cero, hasta 7 enteros y 3 decimales.';
    const start = new Date(values.ventana_inicio); const end = new Date(values.ventana_fin);
    if (!Number.isFinite(start.getTime())) next.ventana_inicio = 'Indica el inicio de la ventana de entrega.';
    if (!Number.isFinite(end.getTime()) || end <= start) next.ventana_fin = 'Indica un fin posterior al inicio de la ventana de entrega.';
    if (!ORDER_PRIORITIES.some(item => item === values.prioridad)) next.prioridad = 'Selecciona una prioridad permitida.';
    if (!PRODUCT_TYPES.some(item => item === values.tipo_producto)) next.tipo_producto = 'Selecciona un tipo de producto permitido.';
    setErrors(next); setError('');
    const first = Object.keys(next)[0]; if (first) { document.getElementById(`order-${first}`)?.focus(); return; }
    submitting.current = true; setLoading(true);
    try {
      const result = await onSave({ cliente: { nombre: values.nombre.trim(), direccion: values.direccion.trim(), latitud: Number(values.latitud), longitud: Number(values.longitud) }, peso_kg: Number(values.peso_kg), volumen_m3: Number(values.volumen_m3), ventana_inicio: start.toISOString(), ventana_fin: end.toISOString(), prioridad: values.prioridad, tipo_producto: values.tipo_producto });
      setRegistered(result); setValues(initial);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo registrar el pedido.'); }
    finally { submitting.current = false; setLoading(false); }
  }
  const attributes = (field: Field) => ({ id: `order-${field}`, value: values[field], 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `order-${field}-error` : undefined });
  const fieldError = (field: Field) => errors[field] && <p className="field-error" id={`order-${field}-error`}>{errors[field]}</p>;
  if (registered) return <div role="status"><h2>Pedido registrado correctamente</h2><p>Código: {registered.pedido_id}</p><p>Estado: Pendiente</p><button className="button button-primary" onClick={() => { setRegistered(null); setErrors({}); }}>Registrar otro pedido</button></div>;
  return <form className="login-form order-form" aria-label="Registrar pedido" noValidate onSubmit={submit}>
    <fieldset disabled={loading}><legend>Cliente y destino</legend>
      {textFields.map(([field, label, max]) => <div className="form-field" key={field}><label htmlFor={`order-${field}`}>{label}</label><input {...attributes(field)} maxLength={max} autoComplete="off" onChange={event => change(field, event.target.value)} />{fieldError(field)}</div>)}
      {numericFields.slice(0, 2).map(([field, label]) => <div className="form-field" key={field}><label htmlFor={`order-${field}`}>{label}</label><input {...attributes(field)} inputMode="decimal" autoComplete="off" onChange={event => change(field, event.target.value)} />{fieldError(field)}</div>)}
    </fieldset>
    <fieldset disabled={loading}><legend>Datos del pedido</legend>
      {numericFields.slice(2).map(([field, label]) => <div className="form-field" key={field}><label htmlFor={`order-${field}`}>{label}</label><input {...attributes(field)} inputMode="decimal" autoComplete="off" onChange={event => change(field, event.target.value)} />{fieldError(field)}</div>)}
      <p className="access-note">Ventana de entrega en tu horario local ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
      {(['ventana_inicio', 'ventana_fin'] as const).map(field => <div className="form-field" key={field}><label htmlFor={`order-${field}`}>{field === 'ventana_inicio' ? 'Inicio de ventana de entrega' : 'Fin de ventana de entrega'}</label><input {...attributes(field)} type="datetime-local" onChange={event => change(field, event.target.value)} />{fieldError(field)}</div>)}
      <div className="form-field"><label htmlFor="order-prioridad">Prioridad</label><select {...attributes('prioridad')} onChange={event => change('prioridad', event.target.value)}><option value="">Selecciona una prioridad</option>{ORDER_PRIORITIES.map(item => <option key={item} value={item}>{item === 'ESTANDAR' ? 'Estándar' : item === 'ECONOMICO' ? 'Económico' : 'Express'}</option>)}</select>{fieldError('prioridad')}</div>
      <div className="form-field"><label htmlFor="order-tipo_producto">Tipo de producto</label><select {...attributes('tipo_producto')} onChange={event => change('tipo_producto', event.target.value)}><option value="">Selecciona un tipo</option>{PRODUCT_TYPES.map(item => <option key={item} value={item}>{item === 'PERECEDERO' ? 'Perecedero' : 'No perecedero'}</option>)}</select>{fieldError('tipo_producto')}</div>
    </fieldset>
    {error && <ErrorMessage message={error} />}<LoadingButton type="submit" loading={loading} loadingLabel="Registrando pedido…">Registrar pedido</LoadingButton>
  </form>;
}
