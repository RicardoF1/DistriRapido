import raw from '../../../../geodata/coverage/v1/coverage.geojson?raw';
import fixtureRaw from '../../../../geodata/coverage/v1/test-points.json?raw';
import { districtAt, normalizePoint, validateCoverage, type Coverage } from '../../../../geodata/coverage';
import { coverageManifest, decodeCoverage, loadCoverage } from './coverage';
const coverage = validateCoverage(JSON.parse(raw), coverageManifest.enabled);
const fixtures = JSON.parse(fixtureRaw) as { points: { id: string; coordinates: [number, number]; expected_covered: boolean; expected_district?: string }[] };
it.each(fixtures.points)('$id: pertenencia con seis decimales', item => {
  const result = districtAt(coverage, { longitud: item.coordinates[0], latitud: item.coordinates[1] });
  expect(Boolean(result)).toBe(item.expected_covered);
  if (item.expected_covered) expect(result?.id).toBe(item.expected_district);
});
it('rechaza Jauja y coordenadas inválidas', () => {
  for (const point of [{ latitud: -11.775, longitud: -75.5 }, { latitud: NaN, longitud: -75 }, { latitud: 91, longitud: 0 }]) expect(districtAt(coverage, point)).toBeNull();
});
it('verifica SHA-256 y falla ante archivo modificado o truncado', async () => {
  await expect(loadCoverage()).resolves.toEqual(coverage);
  await expect(decodeCoverage(raw + ' ')).rejects.toThrow('Integridad');
  await expect(decodeCoverage('{')).rejects.toThrow('Integridad');
});
const square = (x: number) => [[[x, 0], [x + 2, 0], [x + 2, 2], [x, 2], [x, 0]]] as [number, number][][];
const example: Coverage = { type: 'FeatureCollection', features: [{ type: 'Feature', id: '120101', properties: { ubigeo: '120101', nombdist: 'HUANCAYO', nombprov: 'HUANCAYO', nombdep: 'JUNIN' }, geometry: { type: 'MultiPolygon', coordinates: [square(0), square(4)] } }] };
it('MultiPolygon acepta ambas partes y límites, excluye espacio entre partes', () => {
  for (const x of [0, 1, 2, 4, 5, 6]) expect(districtAt(example, { latitud: 1, longitud: x })?.id).toBe('120101');
  expect(districtAt(example, { latitud: 1, longitud: 3 })).toBeNull();
  expect(districtAt(example, { latitud: 0, longitud: 0 })?.id).toBe('120101');
});
it('Polygon con hueco excluye interior y admite borde', () => {
  const value: Coverage = structuredClone(example);
  value.features[0].geometry = { type: 'Polygon', coordinates: [square(0)[0], [[.5,.5],[.5,1.5],[1.5,1.5],[1.5,.5],[.5,.5]]] };
  expect(districtAt(value, { latitud: 1, longitud: 1 })).toBeNull();
  expect(districtAt(value, { latitud: 1, longitud: .5 })?.id).toBe('120101');
});
it('redondea antes de evaluar sin añadir buffer operativo', () => {
  expect(normalizePoint({ latitud: 1.12345678, longitud: 2.0000004 })).toEqual({ latitud: 1.123457, longitud: 2 });
  expect(districtAt(example, { latitud: 1, longitud: 2.0000004 })).not.toBeNull();
  expect(districtAt(example, { latitud: 1, longitud: 2.0000006 })).toBeNull();
});
it('rechaza estructura corrupta, anillos abiertos y códigos incorrectos', () => {
  expect(() => validateCoverage({}, coverageManifest.enabled)).toThrow();
  const value = structuredClone(coverage); value.features[0].properties.ubigeo = '120401';
  expect(() => validateCoverage(value, coverageManifest.enabled)).toThrow('Distrito');
  const open = structuredClone(example); if (open.features[0].geometry.type === 'MultiPolygon') open.features[0].geometry.coordinates[0][0].pop();
  expect(() => validateCoverage(open, { '120101': 'HUANCAYO' })).toThrow('Anillo abierto');
});

it('rechaza manifiesto distinto de la referencia de release aprobada', async () => {
  const original=coverageManifest.version;
  try { coverageManifest.version='2.0.0';await expect(decodeCoverage(raw)).rejects.toThrow('Versión'); } finally { coverageManifest.version=original; }
});
