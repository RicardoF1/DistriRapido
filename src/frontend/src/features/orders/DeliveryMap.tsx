import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCoverage } from '../../hooks/useCoverage';
import { coverageBounds, coverageManifest, districtAt, normalizePoint, OUTSIDE_COVERAGE, type Coverage } from '../../services/coverage';

export interface DeliveryPoint { latitud: number; longitud: number }
export function DeliveryMap({ onChange, disabled, point, focusRevision = 0, confirmed }: { point?: DeliveryPoint | null; focusRevision?: number; confirmed?: boolean; onChange: (point: DeliveryPoint) => void; disabled: boolean }) {
  const { coverage, error: coverageError } = useCoverage();
  const coverageRef = useRef<Coverage | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const selectExternal = useRef<((point: DeliveryPoint, focus: boolean) => void) | null>(null);
  const lastFocus = useRef(0);
  const markerRef = useRef<L.Marker | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onChange);
  const blocked = useRef(disabled);
  const [selected, setSelected] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [outside, setOutside] = useState(false);
  useEffect(() => { callback.current = onChange; blocked.current = disabled; }, [onChange, disabled]);
  useEffect(() => { if (disabled) markerRef.current?.dragging?.disable(); else markerRef.current?.dragging?.enable(); }, [disabled]);
  useEffect(() => {
    const map = L.map(container.current!, { scrollWheelZoom: false }).setView([-12.065, -75.204], 13);
    mapRef.current = map;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    let marker: L.Marker | undefined;
    let lastDragEnd = -Infinity;
    const select = (point: L.LatLng, notify = true) => {
      if (blocked.current || !coverageRef.current) return;
      const normalized = normalizePoint({ latitud: point.lat, longitud: point.lng });
      if (!normalized) return;
      const { latitud, longitud } = normalized;
      const allowed = Boolean(districtAt(coverageRef.current, normalized));
      if (!marker) {
        marker = L.marker([latitud, longitud], { draggable: true, title: 'Destino seleccionado',
          zIndexOffset: 1000,
          icon: L.divIcon({ className: 'delivery-marker', html: '<span aria-hidden="true">●</span>', iconSize: [36, 36], iconAnchor: [18, 18] }),
        }).addTo(map);
        markerRef.current = marker;
        marker.on('dragend', () => { lastDragEnd = performance.now(); select(marker!.getLatLng()); });
      } else marker.setLatLng([latitud, longitud]);
      marker.getElement()?.classList.toggle('delivery-marker-outside', !allowed);
      setOutside(!allowed); setSelected(allowed); if (notify) callback.current({ latitud, longitud });
    };
    selectExternal.current = (point, focus) => {
      const target = L.latLng(point.latitud, point.longitud);
      // A drag already placed the marker; preserve the current map view.
      if (!focus && marker?.getLatLng().equals(target, 0.000001)) return;
      select(target, false); map.setView([point.latitud, point.longitud], 17);
      if (focus) { container.current?.scrollIntoView?.({ block: 'center', behavior: 'instant' }); container.current?.focus({ preventScroll: true }); map.invalidateSize({ pan: false }); }
    };
    // A browser may deliver a map click after releasing the dragged marker,
    // particularly if the status message changes the map's position.
    map.on('click', (event: L.LeafletMouseEvent) => { if (performance.now() - lastDragEnd > 250) select(event.latlng); });
    // Keyboard users can pan with arrows and confirm the map center with Enter.
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.target === container.current) { event.preventDefault(); select(map.getCenter()); }
    };
    container.current!.addEventListener('keydown', keydown);
    const element = container.current!;
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize({ pan: false })) : null;
    observer?.observe(element);
    return () => { observer?.disconnect(); element.removeEventListener('keydown', keydown); selectExternal.current = null; markerRef.current = null; mapRef.current = null; map.remove(); };
  }, []);
  useEffect(() => {
    coverageRef.current = coverage;
    const map = mapRef.current;
    if (!coverage || !map) return;
    const colors = ['#006948', '#2563eb', '#9a3412', '#7c3aed', '#0e7490'];
    const layer = L.geoJSON(coverage, {
      style: feature => ({ color: colors[coverage.features.findIndex(item => item.id === feature?.id) % colors.length], weight: 2, fillOpacity: .12 }),
      onEachFeature: (feature, districtLayer) => {
        const label = document.createElement('span');
        label.textContent = `${feature.properties.nombdist} · ${feature.properties.ubigeo}`;
        districtLayer.bindTooltip(label, { sticky: true });
      },
    }).addTo(map);
    const [west, south, east, north] = coverageBounds(coverage);
    map.fitBounds([[south, west], [north, east]], { padding: [20, 20] });
    return () => { map.removeLayer(layer); };
  }, [coverage]);
  useEffect(() => {
    if (point && coverage) { selectExternal.current?.(point, focusRevision !== lastFocus.current); lastFocus.current = focusRevision; }
  }, [point, coverage, focusRevision]);
  useEffect(() => { markerRef.current?.getElement()?.classList.toggle('delivery-marker-unconfirmed', confirmed === false); }, [point, coverage, confirmed, focusRevision]);
  function showCoverage() {
    if (!coverage || !mapRef.current) return;
    const [west, south, east, north] = coverageBounds(coverage);
    mapRef.current.fitBounds([[south, west], [north, east]], { padding: [20, 20] });
  }
  return <div>
    <div className="coverage-toolbar"><strong>Zona de entrega autorizada</strong><button type="button" className="button button-secondary" onClick={showCoverage} disabled={!coverage}>Ver cobertura</button></div>
    {coverageError ? <p role="alert" className="error-message">{coverageError}</p> : !coverage && <p role="status">Cargando y verificando cobertura…</p>}
    <p id="delivery-map-help">Haz clic en el destino y ajusta el marcador arrastrándolo. Con teclado, mueve el mapa con las flechas y pulsa Enter para seleccionar el centro.</p>
    <div id="order-ubicacion" ref={container} className="delivery-map" role="region" aria-label="Mapa de ubicación de entrega" aria-describedby="delivery-map-help" aria-disabled={disabled || !coverage} />
    <p role={outside ? 'alert' : 'status'} className={outside ? 'field-error' : undefined}>{outside ? OUTSIDE_COVERAGE : selected ? 'Punto de entrega seleccionado.' : 'Selecciona un punto de entrega en el mapa.'}</p>
    {coverage && <ul className="coverage-legend" aria-label="Distritos autorizados">{coverage.features.map((district, index) => <li key={district.id}><span className={`district-color district-color-${index}`} aria-hidden="true" />{district.properties.nombdist}</li>)}</ul>}
    <p className="coverage-source">Límites administrativos INEI · cobertura v{coverageManifest.version}. Los bordes se aceptan; no se han excluido zonas rurales.</p>
    {tileError && <p role="alert">No se pudo cargar el mapa completo. Comprueba tu conexión antes de confirmar el destino.</p>}
  </div>;
}
