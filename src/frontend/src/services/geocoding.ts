import type { DeliveryPoint } from '../features/orders/DeliveryMap';

export interface AddressSuggestion extends DeliveryPoint { address: string }
const endpoint = (import.meta.env.VITE_PHOTON_URL || 'https://photon.komoot.io').replace(/\/$/, '');
const cache = new Map<string, AddressSuggestion[]>();
async function request(path: string, params: Record<string, string>, signal: AbortSignal) {
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
    if (!Array.isArray(coords) || !p || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1]) || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) continue;
    const street = [p.street || p.name, p.housenumber].filter(Boolean).join(' ');
    const address = [...new Set([street, p.district, p.city || p.county, p.state, p.country].filter(item => typeof item === 'string' && item))].join(', ');
    if (!address || address.length > 255) continue;
    results.push({ address, latitud: Number(coords[1].toFixed(6)), longitud: Number(coords[0].toFixed(6)) });
  }
  if (cache.size >= 50) cache.delete(cache.keys().next().value!);
  cache.set(url, results);
  return results;
}
export const geocoding = {
  search: (query: string, signal: AbortSignal) => request('api', { q: query.trim(), lat: '-12.065', lon: '-75.204', zoom: '13', location_bias_scale: '0.1', bbox: '-75.5,-12.4,-74.9,-11.7', limit: '5' }, signal),
  reverse: async (point: DeliveryPoint, signal: AbortSignal) => {
    const results = await request('reverse', { lat: String(point.latitud), lon: String(point.longitud), limit: '1', radius: '0.2' }, signal);
    if (!results.length) throw new Error('Sin dirección para este punto');
    return results[0].address;
  },
};
