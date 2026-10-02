import { useEffect, useRef, useState } from 'react';
import { geocoding, type AddressSuggestion } from '../../services/geocoding';
import type { DeliveryPoint } from './DeliveryMap';

export function useDeliveryAddress(update: (address: string) => void) {
  const [point, setPoint] = useState<DeliveryPoint | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState('');
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  function cancel() { version.current++; request.current?.abort(); setSuggestions([]); setStatus(''); }
  useEffect(() => {
    if (query.trim().length < 4) return;
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => {
      setStatus('Buscando…');
      geocoding.search(query, controller.signal).then(results => {
        if (!controller.signal.aborted) { setSuggestions(results); setStatus(results.length ? '' : 'Sin resultados. Selecciona el destino en el mapa.'); }
      }).catch(() => { if (!controller.signal.aborted) setStatus('Error de búsqueda. Puedes seleccionar el destino en el mapa.'); });
    }, 700);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  useEffect(() => () => { request.current?.abort(); }, []);
  function edit(address: string) { cancel(); setQuery(address); setConfirmed(false); update(address); }
  function choose(item: AddressSuggestion) { cancel(); setQuery(''); update(item.address); setPoint({ latitud: item.latitud, longitud: item.longitud }); setConfirmed(true); }
  async function move(selected: DeliveryPoint) {
    cancel(); setQuery(''); setPoint(selected); setConfirmed(true);
    const revision = version.current;
    const controller = new AbortController(); request.current = controller;
    setStatus('Buscando dirección del punto…');
    try {
      const address = await geocoding.reverse(selected, controller.signal);
      if (revision === version.current && !controller.signal.aborted) { update(address); setStatus(''); }
    } catch {
      if (revision === version.current && !controller.signal.aborted) setStatus('No se pudo obtener la dirección. Se conserva el punto y la dirección anterior; verifica la dirección antes de registrar.');
    }
  }
  function reset() { cancel(); setQuery(''); setPoint(null); setConfirmed(false); }
  return { point, confirmed, suggestions, status, edit, choose, move, reset };
}
