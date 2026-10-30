import { describe, expect, it } from 'vitest';
import { latLngs, legArrows, routeColor, validGeometry } from './map-style';

describe('map style branch coverage', () => {
  it('rejects absent, malformed and out-of-range geometries', () => {
    expect(validGeometry(null)).toBe(false);
    expect(validGeometry('line')).toBe(false);
    expect(validGeometry({ type: 'Point', coordinates: [[-75, -12], [-75.1, -12.1]] })).toBe(false);
    expect(validGeometry({ type: 'LineString', coordinates: 'invalid' })).toBe(false);
    expect(validGeometry({ type: 'LineString', coordinates: [[-75, -12]] })).toBe(false);
    expect(validGeometry({ type: 'LineString', coordinates: [[-75], [-75.1, -12.1]] })).toBe(false);
    expect(validGeometry({ type: 'LineString', coordinates: [['x', -12], [-75.1, -12.1]] })).toBe(false);
    expect(validGeometry({ type: 'LineString', coordinates: [[181, -12], [-75.1, -12.1]] })).toBe(false);
    expect(validGeometry({ type: 'LineString', coordinates: [[-75, 91], [-75.1, -12.1]] })).toBe(false);
  });

  it('accepts and converts valid lines and cycles colors', () => {
    const geometry = { type: 'LineString' as const, coordinates: [[-75, -12], [-75.1, -12.1]] };
    expect(validGeometry(geometry)).toBe(true);
    expect(latLngs(geometry)).toEqual([[-12, -75], [-12.1, -75.1]]);
    expect(routeColor(4)).toBe(routeColor(0));
  });

  it('builds an arrow for a route leg', () => {
    const geometry = { type: 'LineString' as const, coordinates: [[-75, -12], [-75.05, -12.05], [-75.1, -12.1]] };
    expect(legArrows(geometry, [
      { latitud: -12, longitud: -75 },
      { latitud: -12.1, longitud: -75.1 },
    ])).toHaveLength(1);
  });
});