import { coverageBounds, districtAt, loadCoverage, normalizePoint, type DeliveryPoint } from './coverage';
export interface AddressSuggestion extends DeliveryPoint {
  address: string;
  district?: string;
  ubigeo?: string;
  administrative?: { district?: string; city?: string; county?: string; state?: string; country?: string; countrycode?: string; osm_id?: string | number };
}
const endpoint = (import.meta.env.VITE_PHOTON_URL || 'https://photon.komoot.io').replace(/\/$/, '');
const cache = new Map<string, AddressSuggestion[]>();
async function request(path: string, params: Record<string, string>, signal: AbortSignal) {
  const coverage = await loadCoverage();
  signal.throwIfAborted();
  const url = `${endpoint}/${path}/?${new URLSearchParams(params)}`;
  if (cache.has(url)) return cache.get(url)!;
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]), credentials: 'omit' });
  if (!response.ok) throw new Error('Error de búsqueda');
  const body = await response.json();
  if (!Array.isArray(body.features)) throw new Error('Respuesta inválida');
  const results: AddressSuggestion[] = [];
  for (const feature of body.features) {
    const coords = feature.geometry?.coordinates;
    const p = feature.properties;
    if (feature.geometry?.type && feature.geometry.type !== 'Point') continue;
    if (!Array.isArray(coords) || !p) continue;
    const point = normalizePoint({ latitud: coords[1], longitud: coords[0] });
    if (!point) continue;
    const district = districtAt(coverage, point);
    if (!district) continue;
    const street = [p.street || p.name, p.housenumber].filter(Boolean).join(' ');
    const address = [...new Set([street, p.district, p.city || p.county, p.state, p.country].filter(item => typeof item === 'string' && item))].join(', ');
    if (!address || address.length > 255) continue;
    const administrative: NonNullable<AddressSuggestion['administrative']> = {};
    for (const key of ['district', 'city', 'county', 'state', 'country', 'countrycode'] as const) if (typeof p[key] === 'string') administrative[key] = p[key];
    if (typeof p.osm_id === 'number' || typeof p.osm_id === 'string') administrative.osm_id = p.osm_id;
    results.push({ address, ...point, district: district.properties.nombdist, ubigeo: district.id, administrative });
  }
  if (cache.size >= 50) cache.delete(cache.keys().next().value!);
  cache.set(url, results);
  return results;
}
export const geocoding = {
  search: async (query: string, signal: AbortSignal) => {
    const coverage = await loadCoverage();
    return request('api', { q: query.trim(), countrycode: 'PE', lat: '-12.065', lon: '-75.204', zoom: '13', location_bias_scale: '0.1', bbox: coverageBounds(coverage).join(','), limit: '15' }, signal);
  },
  reverse: async (point: DeliveryPoint, signal: AbortSignal) => {
    const coverage = await loadCoverage(); const normalized = normalizePoint(point);
    if (!normalized || !districtAt(coverage, normalized)) throw new Error('Fuera de cobertura');
    const results = await request('reverse', { lat: String(normalized.latitud), lon: String(normalized.longitud), limit: '1', radius: '0.2' }, signal);
    if (!results.length) throw new Error('Sin dirección para este punto');
    return results[0].address;
  },
};
