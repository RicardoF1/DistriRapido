import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteDetail } from '../../types/routes';
export function RouteMap({ version }: { version: RouteDetail['versiones'][number] }) {
  const container = useRef<HTMLDivElement>(null); const [error, setError] = useState('');
  const geometry = version.resultado.geometry;
  const valid = geometry?.type === 'LineString' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2 && geometry.coordinates.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90);
  useEffect(() => {
    if (!valid) return;
    const map = L.map(container.current!, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).on('tileerror', () => setError('No se pudieron cargar las teselas. Consulta la tabla de paradas.')).addTo(map);
    const route = L.geoJSON(geometry as GeoJSON.LineString, { style: { color: '#123e74', weight: 6 } }).addTo(map);
    const origin = version.resultado.origin; L.marker([origin.latitud, origin.longitud], { title: 'Origen', icon: L.divIcon({ className: 'route-stop-marker origin', html: '<span>O</span>', iconSize: [32, 32] }) }).addTo(map);
    for (const stop of version.paradas) L.marker([stop.datos.latitud, stop.datos.longitud], { title: 'Parada ' + stop.secuencia, icon: L.divIcon({ className: 'route-stop-marker', html: '<span>' + Number(stop.secuencia) + '</span>', iconSize: [32, 32] }) }).addTo(map);
    map.fitBounds(route.getBounds(), { padding: [35, 35], maxZoom: 17 }); const observer = new ResizeObserver(() => map.invalidateSize({ pan: false })); observer.observe(container.current!);
    return () => { observer.disconnect(); map.remove(); };
  }, [version, geometry, valid]);
  return <><div className="route-map" ref={container} tabIndex={0} role="region" aria-label="Recorrido registrado de solo lectura" />{!valid && <p role="alert">Geometría no disponible. No se dibujará un recorrido sustituto.</p>}{error && <p role="status">{error}</p>}</>;
}
