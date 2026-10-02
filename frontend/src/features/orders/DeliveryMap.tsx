import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface DeliveryPoint { latitud: number; longitud: number }
export function DeliveryMap({ onChange, disabled }: { onChange: (point: DeliveryPoint) => void; disabled: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onChange);
  const blocked = useRef(disabled);
  const [selected, setSelected] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => { callback.current = onChange; blocked.current = disabled; }, [onChange, disabled]);
  useEffect(() => {
    const map = L.map(container.current!, { scrollWheelZoom: false }).setView([-12.065, -75.204], 13);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    let marker: L.Marker | undefined;
    const select = (point: L.LatLng) => {
      if (blocked.current) return;
      const latitud = Number(Math.max(-90, Math.min(90, point.lat)).toFixed(6));
      const longitud = Number(point.wrap().lng.toFixed(6));
      if (!marker) {
        marker = L.marker([latitud, longitud], { draggable: true, title: 'Destino seleccionado',
          icon: L.divIcon({ className: 'delivery-marker', html: '<span aria-hidden="true">●</span>', iconSize: [28, 28], iconAnchor: [14, 14] }),
        }).addTo(map);
        marker.on('dragend', () => select(marker!.getLatLng()));
      } else marker.setLatLng([latitud, longitud]);
      setSelected(true); callback.current({ latitud, longitud });
    };
    map.on('click', (event: L.LeafletMouseEvent) => select(event.latlng));
    // Keyboard users can pan with arrows and confirm the map center with Enter.
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.target === container.current) { event.preventDefault(); select(map.getCenter()); }
    };
    container.current!.addEventListener('keydown', keydown);
    const element = container.current!;
    return () => { element.removeEventListener('keydown', keydown); map.remove(); };
  }, []);
  return <div>
    <p id="delivery-map-help">Haz clic en el destino y ajusta el marcador arrastrándolo. Con teclado, mueve el mapa con las flechas y pulsa Enter para seleccionar el centro.</p>
    <div id="order-ubicacion" ref={container} className="delivery-map" role="region" aria-label="Mapa de ubicación de entrega" aria-describedby="delivery-map-help" aria-disabled={disabled} />
    <p role="status">{selected ? 'Punto de entrega seleccionado.' : 'Selecciona un punto de entrega en el mapa.'}</p>
    {tileError && <p role="alert">No se pudo cargar el mapa completo. Comprueba tu conexión antes de confirmar el destino.</p>}
  </div>;
}
