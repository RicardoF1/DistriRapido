import { vi } from 'vitest';
import { geocoding } from './geocoding';
import { coverageBounds, loadCoverage } from './coverage';
afterEach(() => vi.unstubAllGlobals());
it('Photon restringe país/bbox, conserva metadatos y reutiliza caché', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: 'Point', coordinates: [2.12345678, 2.12345678] }, properties: { name: 'Giráldez', city: 'Huancayo', state: 'Junín', country: 'Perú', countrycode: 'PE', osm_id: 123 } }] }) });
  vi.stubGlobal('fetch', fetcher);
  const signal = new AbortController().signal;
  const results = await geocoding.search('Giráldez servicio', signal);
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({ address: 'Giráldez, Huancayo, Junín, Perú', latitud: 2.123457, longitud: 2.123457, administrative: { osm_id: 123, countrycode: 'PE' } });
  const url = new URL(fetcher.mock.calls[0][0]);
  expect(url.searchParams.get('lat')).toBe('-12.065'); expect(url.searchParams.get('countrycode')).toBe('PE');
  expect(url.searchParams.get('bbox')).toBe(coverageBounds(await loadCoverage()).join(','));
  expect(url.searchParams.get('q')).toBe('Giráldez servicio');
  await geocoding.search('Giráldez servicio', signal); expect(fetcher).toHaveBeenCalledTimes(1);
});
it('Tambo ambiguo descarta Jauja aunque el texto coincida o diga Huancayo', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [
    { geometry: { coordinates: [40, 20] }, properties: { name: 'El Tambo', city: 'Huancayo' } },
    { geometry: { coordinates: [14, 2] }, properties: { name: 'El Tambo', county: 'Huancayo', state: 'Junín', country: 'Perú' } },
  ] }) }));
  const items = await geocoding.search('Tambo ambiguo', new AbortController().signal);
  expect(items).toHaveLength(1); expect(items[0].ubigeo).toBe('120114');
});
it('rechaza error HTTP, coordenadas fuera de cobertura y respuesta inversa vacía', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });
  vi.stubGlobal('fetch', fetcher);
  const signal = new AbortController().signal;
  await expect(geocoding.search('error servicio', signal)).rejects.toThrow();
  await expect(geocoding.reverse({ latitud: 2, longitud: 2 }, signal)).rejects.toThrow('Sin dirección');
  await expect(geocoding.reverse({ latitud: 20, longitud: 40 }, signal)).rejects.toThrow('Fuera de cobertura');
  expect(fetcher).toHaveBeenCalledTimes(2);
});
