/** Shared geographic policy. No coordinates or district list are duplicated here. */
export interface DeliveryPoint { latitud: number; longitud: number }
export type Position = [number, number];
export type Rings = Position[][];
export interface DistrictFeature {
  type: 'Feature'; id: string;
  properties: { ubigeo: string; nombdist: string; nombprov: string; nombdep: string };
  geometry: { type: 'Polygon'; coordinates: Rings } | { type: 'MultiPolygon'; coordinates: Rings[] };
}
export interface Coverage { type: 'FeatureCollection'; features: DistrictFeature[] }
export function normalizePoint(point: DeliveryPoint): DeliveryPoint | null {
  if (!Number.isFinite(point.latitud) || !Number.isFinite(point.longitud) || Math.abs(point.latitud) > 90 || Math.abs(point.longitud) > 180) return null;
  return { latitud: Number(point.latitud.toFixed(6)), longitud: Number(point.longitud.toFixed(6)) };
}
// 0 outside, 1 inside, 2 on boundary. Numerical tolerance is not an operational buffer.
function ringPosition([x, y]: Position, ring: Position[]): number {
  let inside = false;
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = ring[i - 1]; const [bx, by] = ring[i];
    const dx = bx - ax, dy = by - ay;
    const cross = (x - ax) * dy - (y - ay) * dx;
    const length = Math.hypot(dx, dy);
    if (length > 0 && Math.abs(cross) / length <= 1e-12 && x >= Math.min(ax, bx) - 1e-12 && x <= Math.max(ax, bx) + 1e-12 && y >= Math.min(ay, by) - 1e-12 && y <= Math.max(ay, by) + 1e-12) return 2;
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside ? 1 : 0;
}
function polygonCovers(point: Position, rings: Rings): boolean {
  const outer = ringPosition(point, rings[0]);
  if (!outer) return false;
  if (outer === 2) return true;
  for (const hole of rings.slice(1)) {
    const position = ringPosition(point, hole);
    if (position === 2) return true;
    if (position === 1) return false;
  }
  return true;
}
/** Boundary accepted after rounding the point to six decimals; lowest UBIGEO wins shared edges. */
export function districtAt(coverage: Coverage, point: DeliveryPoint): DistrictFeature | null {
  const normalized = normalizePoint(point);
  if (!normalized) return null;
  const position: Position = [normalized.longitud, normalized.latitud];
  return [...coverage.features].sort((a, b) => a.id.localeCompare(b.id)).find(feature => {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    return polygons.some(rings => polygonCovers(position, rings));
  }) ?? null;
}
export function coverageBounds(coverage: Coverage): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of coverage.features) {
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) for (const [x, y] of ring) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  return [minX, minY, maxX, maxY];
}
export function validateCoverage(value: unknown, enabled: Record<string, string>): Coverage {
  const coverage = value as Coverage;
  if (!coverage || coverage.type !== 'FeatureCollection' || !Array.isArray(coverage.features) || coverage.features.length !== Object.keys(enabled).length) throw new Error('Cobertura inválida');
  const ids = new Set<string>();
  for (const f of coverage.features) {
    if (!f || f.type !== 'Feature' || ids.has(f.id) || !enabled[f.id] || f.properties?.ubigeo !== f.id || f.properties.nombdist !== enabled[f.id] || f.properties.nombprov !== 'HUANCAYO' || f.properties.nombdep !== 'JUNIN') throw new Error('Distrito inválido');
    ids.add(f.id);
    if (!f.geometry || !['Polygon', 'MultiPolygon'].includes(f.geometry.type)) throw new Error('Geometría inválida');
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    if (!Array.isArray(polygons) || !polygons.length) throw new Error('Geometría vacía');
    for (const polygon of polygons) {
      if (!Array.isArray(polygon) || !polygon.length) throw new Error('Polígono vacío');
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4) throw new Error('Anillo inválido');
        for (const p of ring) if (!Array.isArray(p) || p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) throw new Error('Coordenada inválida');
        if (ring[0][0] !== ring.at(-1)![0] || ring[0][1] !== ring.at(-1)![1]) throw new Error('Anillo abierto');
      }
    }
  }
  return coverage;
}
