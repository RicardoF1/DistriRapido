import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteDetail } from '../../types/routes';
import { formatDistance, formatDuration, latLngs, legArrows, validGeometry } from './map-style';

const ROUTE_COLOR = '#0b6bcb';
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function RouteMap({ version }: { version: RouteDetail['versiones'][number] }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const bounds = useRef<L.LatLngBounds | null>(null);
  const [error, setError] = useState('');
  const geometry = version.resultado.geometry;
  const line = validGeometry(geometry) ? geometry : null;
  useEffect(() => {
    if (!line || !container.current) return;
    const view = L.map(container.current, { scrollWheelZoom: false, zoomControl: true });
    map.current = view;
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION })
      .on('tileerror', () => setError('No se pudo cargar el mapa base. El recorrido y las paradas siguen disponibles.'))
      .addTo(view);
    const coordinates = latLngs(line);
    const casing = L.polyline(coordinates, { color: '#ffffff', weight: 10, opacity: .95, lineCap: 'round', lineJoin: 'round' }).addTo(view);
    L.polyline(coordinates, { color: ROUTE_COLOR, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(view);
    const origin = version.resultado.origin;
    L.marker([origin.latitud, origin.longitud], { title: 'Origen: ' + origin.label, icon: L.divIcon({ className: 'route-stop-marker origin', html: '<span>O</span>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(view);
    for (const stop of version.paradas) L.marker([stop.datos.latitud, stop.datos.longitud], { title: 'Parada ' + stop.secuencia + ': ' + stop.datos.direccion, icon: L.divIcon({ className: 'route-stop-marker', html: '<span>' + Number(stop.secuencia) + '</span>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(view);
    const points = [origin, ...version.paradas.map(stop => ({ latitud: stop.datos.latitud, longitud: stop.datos.longitud })), ...(version.resultado.return_to_origin ? [origin] : [])];
    for (const arrow of legArrows(line, points)) L.marker([arrow.lat, arrow.lng], { interactive: false, icon: L.divIcon({ className: 'route-direction', html: '<span style="transform: rotate(' + arrow.angle + 'deg)"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(view);
    bounds.current = casing.getBounds();
    view.fitBounds(bounds.current, { padding: [45, 45], maxZoom: 16 });
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(view);
    const observer = new ResizeObserver(() => view.invalidateSize({ pan: false }));
    observer.observe(container.current);
    return () => { observer.disconnect(); view.remove(); map.current = null; bounds.current = null; };
  }, [line, version]);
  const recenter = () => { if (map.current && bounds.current) map.current.fitBounds(bounds.current, { padding: [45, 45], maxZoom: 16 }); };
  return <section className="map-card">
    <div className="map-card-heading">
      <div><h2>Mapa del recorrido</h2><p>El trazado sigue las vías calculadas por OSRM. Los números indican el orden de visita.</p></div>
      <div className="map-metrics"><span className="map-chip"><strong>{formatDistance(version.distancia_m)}</strong><span>distancia</span></span><span className="map-chip"><strong>{formatDuration(version.duracion_s)}</strong><span>viaje</span></span></div>
    </div>
    {line ? <div className="map-frame">
      <div className="route-map" ref={container} tabIndex={0} role="region" aria-label="Recorrido registrado de solo lectura" />
      <button type="button" className="map-recenter" onClick={recenter} aria-label="Centrar el recorrido en el mapa">Centrar</button>
    </div> : <p role="alert">Geometría no disponible. No se dibujará un recorrido sustituto.</p>}
    <ul className="map-legend" aria-label="Leyenda del mapa">
      <li><span className="map-legend-line" aria-hidden="true" /> Trazado calculado</li>
      <li><span className="map-legend-dot origin" aria-hidden="true">O</span> Origen</li>
      <li><span className="map-legend-dot" aria-hidden="true">1</span> Paradas en orden</li>
      <li><span className="map-legend-arrow" aria-hidden="true" /> Sentido del recorrido</li>
    </ul>
    {error && <p role="status">{error}</p>}
  </section>;
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
