import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Calculation } from '../../types/planning';
import { latLngs, routeColor, validGeometry } from './map-style';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function AlternativesMap({ alternatives, activeId }: { alternatives: Calculation['alternativas']; activeId?: string | null }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const bounds = useRef<L.LatLngBounds | null>(null);
  const layers = useRef<{ id: string; casing: L.Polyline; line: L.Polyline }[]>([]);
  const [error, setError] = useState('');
  const drawable = useMemo(() => alternatives.flatMap((alternative, index) => {
    const version = alternative.rutas[0]?.version;
    return version && validGeometry(version.geometry) ? [{ id: alternative.alternativa_id, color: routeColor(index), geometry: version.geometry, origin: version.origin }] : [];
  }), [alternatives]);
  const hasGeometry = drawable.length > 0;
  useEffect(() => {
    if (!hasGeometry || !container.current) return;
    const view = L.map(container.current, { scrollWheelZoom: false, zoomControl: true });
    map.current = view;
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION })
      .on('tileerror', () => setError('No se pudo cargar el mapa base. Las alternativas siguen disponibles en sus tarjetas.'))
      .addTo(view);
    layers.current = drawable.map(item => {
      const coordinates = latLngs(item.geometry);
      const casing = L.polyline(coordinates, { color: '#ffffff', weight: 10, opacity: .95, lineCap: 'round', lineJoin: 'round' }).addTo(view);
      const line = L.polyline(coordinates, { color: item.color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(view);
      return { id: item.id, casing, line };
    });
    const first = drawable[0];
    const origin = first.origin ?? { latitud: first.geometry.coordinates[0][1], longitud: first.geometry.coordinates[0][0], label: 'Origen' };
    L.marker([origin.latitud, origin.longitud], { title: 'Origen: ' + origin.label, icon: L.divIcon({ className: 'route-stop-marker origin', html: '<span>O</span>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(view);
    bounds.current = L.latLngBounds(drawable.flatMap(item => latLngs(item.geometry)));
    view.fitBounds(bounds.current, { padding: [45, 45], maxZoom: 16 });
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(view);
    const observer = new ResizeObserver(() => view.invalidateSize({ pan: false }));
    observer.observe(container.current);
    return () => { observer.disconnect(); view.remove(); map.current = null; bounds.current = null; layers.current = []; };
  }, [drawable, hasGeometry]);
  useEffect(() => {
    const hasActive = layers.current.some(layer => layer.id === activeId);
    for (const layer of layers.current) {
      const active = !activeId || !hasActive || layer.id === activeId;
      layer.line.setStyle({ opacity: active ? 1 : .18, weight: active ? 6 : 4 });
      layer.casing.setStyle({ opacity: active ? .95 : .12 });
    }
  }, [activeId]);
  const recenter = () => { if (map.current && bounds.current) map.current.fitBounds(bounds.current, { padding: [45, 45], maxZoom: 16 }); };
  return <section className="map-card map-card-alternatives">
    <div className="map-card-heading">
      <div><h2>Mapa comparativo</h2><p>Cada color es una alternativa. Pasa el cursor por una tarjeta para resaltar su trazado.</p></div>
      <div className="map-metrics"><span className="map-chip"><strong>{alternatives.length}</strong><span>{alternatives.length === 1 ? 'alternativa' : 'alternativas'}</span></span></div>
    </div>
    {hasGeometry ? <div className="map-frame">
      <div className="route-map" ref={container} tabIndex={0} role="region" aria-label="Mapa comparativo de alternativas de ruta" />
      <button type="button" className="map-recenter" onClick={recenter} aria-label="Centrar todas las alternativas en el mapa">Centrar</button>
    </div> : <p role="alert">No hay geometrías disponibles para comparar las alternativas. Abre cada recorrido para ver su detalle.</p>}
    <ul className="map-legend" aria-label="Leyenda de alternativas">
      {alternatives.map((alternative, index) => <li key={alternative.alternativa_id} className={activeId && activeId !== alternative.alternativa_id ? 'is-muted' : ''}><span className="map-legend-line" style={{ background: routeColor(index) }} aria-hidden="true" /> Alternativa {alternative.numero ?? index + 1}</li>)}
      <li><span className="map-legend-dot origin" aria-hidden="true">O</span> Origen compartido</li>
    </ul>
    {error && <p role="status">{error}</p>}
  </section>;
}
