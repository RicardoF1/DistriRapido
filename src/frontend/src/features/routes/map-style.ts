export interface GeoPoint { latitud: number; longitud: number }
export interface LineGeometry { type: 'LineString'; coordinates: number[][] }
export const ROUTE_COLORS = ['#0b6bcb', '#c026d3', '#0f9d58', '#ea580c'] as const;
export const routeColor = (index: number) => ROUTE_COLORS[index % ROUTE_COLORS.length];
export const formatDistance = (meters: number | string) => (Number(meters) / 1000).toFixed(2) + ' km';
export const formatDuration = (seconds: number | string) => (Number(seconds) / 60).toFixed(1) + ' min';
const isCoordinate = (value: unknown): value is number[] => Array.isArray(value) && value.length === 2 && value.every(item => typeof item === 'number' && Number.isFinite(item)) && Math.abs((value as number[])[0]) <= 180 && Math.abs((value as number[])[1]) <= 90;
export function validGeometry(value: unknown): value is LineGeometry {
  if (!value || typeof value !== 'object') return false;
  const geometry = value as { type?: unknown; coordinates?: unknown };
  return geometry.type === 'LineString' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2 && geometry.coordinates.every(isCoordinate);
}
export function latLngs(geometry: LineGeometry): [number, number][] {
  return geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
}
/** One arrow per leg, placed on the closest geometry point to the leg midpoint. */
export function legArrows(geometry: LineGeometry, points: GeoPoint[]) {
  const coordinates = geometry.coordinates;
  return points.slice(1).map((end, index) => {
    const start = points[index];
    const middleLongitude = (start.longitud + end.longitud) / 2;
    const middleLatitude = (start.latitud + end.latitud) / 2;
    let closest = 0; let closestDistance = Infinity;
    coordinates.forEach(([longitude, latitude], position) => {
      const distance = (longitude - middleLongitude) ** 2 + (latitude - middleLatitude) ** 2;
      if (distance < closestDistance) { closestDistance = distance; closest = position; }
    });
    const before = coordinates[Math.max(0, closest - 1)];
    const after = coordinates[Math.min(coordinates.length - 1, closest + 1)];
    const east = after[0] - before[0];
    const screenUp = after[1] - before[1];
    const angle = Math.round(Math.atan2(-screenUp, east) * 180 / Math.PI);
    return { lat: coordinates[closest][1], lng: coordinates[closest][0], angle };
  });
}
