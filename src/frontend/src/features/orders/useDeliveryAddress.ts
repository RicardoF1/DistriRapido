import { useEffect, useRef, useState } from 'react';
import { geocoding, type AddressSuggestion } from '../../services/geocoding';
import type { DeliveryPoint } from './DeliveryMap';
import { useCoverage } from '../../hooks/useCoverage';
import { districtAt, normalizePoint, OUTSIDE_COVERAGE, COVERAGE_ERROR } from '../../services/coverage';

export function useDeliveryAddress(update: (address: string) => void) {
  const { coverage, error: coverageError } = useCoverage();
  const [point, setPoint] = useState<DeliveryPoint | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [focusRevision, setFocusRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState('');
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  function cancel() { version.current++; request.current?.abort(); setSuggestions([]); setStatus(''); }
  useEffect(() => {
    if (query.trim().length < 4 || !coverage) return;
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => {
      setStatus('Buscando…');
      geocoding.search(query, controller.signal).then(results => {
        if (!controller.signal.aborted) { const allowed = results.filter(item => districtAt(coverage, item)); setSuggestions(allowed); setStatus(allowed.length ? '' : 'Sin resultados dentro de la cobertura. Selecciona un destino autorizado en el mapa.'); }
      }).catch(() => { if (!controller.signal.aborted) setStatus('Error de búsqueda. Puedes seleccionar el destino en el mapa.'); });
    }, 700);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, coverage]);
  useEffect(() => () => { request.current?.abort(); }, []);
  function edit(address: string) { cancel(); setQuery(address); setConfirmed(false); update(address); }
  function choose(item: AddressSuggestion) {
    cancel(); setQuery('');
    const selected = normalizePoint(item);
    if (!coverage || !selected || !districtAt(coverage, selected)) { setConfirmed(false); setStatus(coverage ? OUTSIDE_COVERAGE : COVERAGE_ERROR); return; }
    update(item.address); setPoint(selected); setConfirmed(true); setFocusRevision(value => value + 1);
  }
  async function move(selected: DeliveryPoint) {
    cancel(); setQuery('');
    const normalized = normalizePoint(selected);
    setPoint(normalized); setConfirmed(false);
    if (!coverage || !normalized || !districtAt(coverage, normalized)) { setStatus(coverage ? OUTSIDE_COVERAGE : COVERAGE_ERROR); return; }
    selected = normalized;
    const revision = version.current;
    const controller = new AbortController(); request.current = controller;
    setStatus('Buscando dirección del punto…');
    try {
      const address = await geocoding.reverse(selected, controller.signal);
      if (revision === version.current && !controller.signal.aborted) { update(address); setConfirmed(true); setStatus(''); }
    } catch {
      if (revision === version.current && !controller.signal.aborted) setStatus('No se pudo obtener la dirección. La ubicación no está confirmada. Selecciona una sugerencia válida o vuelve a seleccionar el punto para reintentar.');
    }
  }
  function reset() { cancel(); setQuery(''); setPoint(null); setConfirmed(false); }
  const valid = Boolean(coverage && point && districtAt(coverage, point));
  return { point, confirmed: confirmed && valid, focusRevision, suggestions, status, edit, choose, move, reset, coverage, coverageError, covered: valid };
}
