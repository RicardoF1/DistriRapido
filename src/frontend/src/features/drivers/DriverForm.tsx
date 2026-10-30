import {useState,type FormEvent} from 'react';
import type {DriverValues} from '../../types/drivers';
const blank:DriverValues={nombre_completo:'',dni:'',licencia_categoria:'',anios_experiencia:0,telefono:'',estado:'ACTIVO'};
export function DriverForm({initial,onSave}:{initial?:DriverValues;onSave:(values:DriverValues)=>Promise<unknown>}){
 const [values,setValues]=useState<DriverValues>(initial ? Object.fromEntries((Object.keys(blank) as (keyof DriverValues)[]).map(key=>[key,initial[key]])) as unknown as DriverValues : blank);const [saving,setSaving]=useState(false);const [error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setError('');const data={...values,nombre_completo:values.nombre_completo.trim(),dni:values.dni.trim(),licencia_categoria:values.licencia_categoria.trim(),telefono:values.telefono.trim()};
 if(!data.nombre_completo||!data.dni||!data.licencia_categoria||!data.telefono||!Number.isInteger(data.anios_experiencia)||data.anios_experiencia<0||data.anios_experiencia>32767){setError('Completa los campos obligatorios y una experiencia entera no negativa.');return;}
 setSaving(true);try{await onSave(data);}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo guardar el conductor.');}finally{setSaving(false);}}
 return <form className="driver-form" onSubmit={submit}><fieldset disabled={saving}><legend>Datos del conductor</legend><div className="driver-fields">{(['nombre_completo','dni','licencia_categoria','telefono'] as const).map(key=><label className="form-field" key={key}>{({nombre_completo:'Nombre completo',dni:'DNI',licencia_categoria:'Categoría de licencia',telefono:'Teléfono'})[key]}<input required maxLength={key==='nombre_completo'?150:key==='telefono'?30:20} value={values[key]} onChange={e=>setValues({...values,[key]:e.target.value})}/></label>)}
 <label className="form-field">Años de experiencia<input type="number" required min={0} max={32767} step={1} value={values.anios_experiencia} onChange={e=>setValues({...values,anios_experiencia:e.target.value===''?NaN:Number(e.target.value)})}/></label>
 <label className="form-field">Estado administrativo<select value={values.estado} onChange={e=>setValues({...values,estado:e.target.value as DriverValues['estado']})}><option>ACTIVO</option><option>INACTIVO</option></select></label>
 </div></fieldset>
 {error&&<p role="alert">{error}</p>}<button className="button button-primary" disabled={saving}>{saving?'Guardando…':'Guardar conductor'}</button></form>;
}
