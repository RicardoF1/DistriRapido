import { vi } from 'vitest';
import { geocoding } from './geocoding';
afterEach(() => vi.unstubAllGlobals());
it('consulta Photon con foco Huancayo, transforma GeoJSON y reutiliza caché', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { coordinates: [-75.21123456, -12.07123456] }, properties: { name: 'Giráldez', city: 'Huancayo', state: 'Junín', country: 'Perú' } }] }) });
  vi.stubGlobal('fetch', fetcher);
  const signal = new AbortController().signal;
  expect(await geocoding.search('Giráldez servicio', signal)).toEqual([{ address: 'Giráldez, Huancayo, Junín, Perú', latitud: -12.071235, longitud: -75.211235 }]);
  const url = new URL(fetcher.mock.calls[0][0]);
  expect(url.searchParams.get('lat')).toBe('-12.065'); expect(url.searchParams.get('bbox')).toBe('-75.5,-12.4,-74.9,-11.7');
  await geocoding.search('Giráldez servicio', signal); expect(fetcher).toHaveBeenCalledTimes(1);
});
it('rechaza error HTTP y respuesta inversa vacía', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) }));
  const signal = new AbortController().signal;
  await expect(geocoding.search('error servicio', signal)).rejects.toThrow();
  await expect(geocoding.reverse({ latitud: -12, longitud: -75 }, signal)).rejects.toThrow('Sin dirección');
});
