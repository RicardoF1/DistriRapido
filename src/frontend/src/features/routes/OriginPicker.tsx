import { useEffect, useState } from 'react';
import { DeliveryMap } from '../orders/DeliveryMap';
import { useDeliveryAddress } from '../orders/useDeliveryAddress';
import type { Origin } from '../../types/planning';
export function OriginPicker({ disabled, onChange }: { disabled: boolean; onChange: (point: Origin | null) => void }) {
  const [label, setLabel] = useState(''); const location = useDeliveryAddress(setLabel);
  const { point, confirmed } = location;
  useEffect(() => { onChange(confirmed && point ? { ...point, label } : null); }, [point, confirmed, label, onChange]);
  return <fieldset disabled={disabled}><legend>Origen operativo</legend><label className="form-field">Dirección del origen<input value={label} maxLength={150} autoComplete="off" onChange={e => location.edit(e.target.value)} /></label>
    <p role="status">{location.status || (confirmed ? 'Punto de origen seleccionado; confirma abajo para preparar.' : 'Selecciona una sugerencia o un punto del mapa.')}</p>
    {location.coverageError && <p role="alert">{location.coverageError}</p>}
    {location.suggestions.length > 0 && <ul className="address-suggestions">{location.suggestions.map((s, i) => <li key={i}><button type="button" onClick={() => location.choose(s)}>{s.address}</button></li>)}</ul>}
    <DeliveryMap point={location.point} confirmed={location.confirmed} focusRevision={location.focusRevision} disabled={disabled} onChange={point => { void location.move(point); }} />
    <small>Direcciones: Photon / OpenStreetMap. No se toma la ubicación del conductor.</small>
  </fieldset>;
}
