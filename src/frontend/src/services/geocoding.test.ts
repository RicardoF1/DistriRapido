import { vi } from 'vitest';
import { geocoding } from './geocoding';
import { coverageBounds, loadCoverage } from './coverage';
afterEach(() => vi.unstubAllGlobals());
it('Photon restringe país/bbox, conserva metadatos y reutiliza caché', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: 'Point', coordinates: [-75.21123456, -12.07123456] }, properties: { name: 'Giráldez', city: 'Huancayo', state: 'Junín', country: 'Perú', countrycode: 'PE', osm_id: 123 } }] }) });
  vi.stubGlobal('fetch', fetcher);
  const signal = new AbortController().signal;
  const results = await geocoding.search('Giráldez servicio', signal);
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({ address: 'Giráldez, Huancayo, Junín, Perú', latitud: -12.071235, longitud: -75.211235, administrative: { osm_id: 123, countrycode: 'PE' } });
  const url = new URL(fetcher.mock.calls[0][0]);
  expect(url.searchParams.get('lat')).toBe('-12.065'); expect(url.searchParams.get('countrycode')).toBe('PE');
  expect(url.searchParams.get('bbox')).toBe(coverageBounds(await loadCoverage()).join(','));
  expect(url.searchParams.get('q')).toBe('Giráldez servicio');
  await geocoding.search('Giráldez servicio', signal); expect(fetcher).toHaveBeenCalledTimes(1);
});
it('Tambo ambiguo descarta Jauja aunque el texto coincida o diga Huancayo', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [
    { geometry: { coordinates: [-75.5, -11.775] }, properties: { name: 'El Tambo', city: 'Huancayo' } },
    { geometry: { coordinates: [-75.147342, -11.97218] }, properties: { name: 'El Tambo', county: 'Huancayo', state: 'Junín', country: 'Perú' } },
  ] }) }));
  const items = await geocoding.search('Tambo ambiguo', new AbortController().signal);
  expect(items).toHaveLength(1); expect(items[0].ubigeo).toBe('120114');
});
it('rechaza error HTTP, coordenadas fuera de cobertura y respuesta inversa vacía', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });
  vi.stubGlobal('fetch', fetcher);
  const signal = new AbortController().signal;
  await expect(geocoding.search('error servicio', signal)).rejects.toThrow();
  await expect(geocoding.reverse({ latitud: -12.065, longitud: -75.204 }, signal)).rejects.toThrow('Sin dirección');
  await expect(geocoding.reverse({ latitud: -11.775, longitud: -75.5 }, signal)).rejects.toThrow('Fuera de cobertura');
  expect(fetcher).toHaveBeenCalledTimes(2);
});
