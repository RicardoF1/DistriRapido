import { act, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { RouteMap } from './RouteMap';
import { routeFixture } from '../../test/route-fixture';
const mocks = vi.hoisted(() => ({ map: vi.fn(), fitBounds: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn(), tileError: undefined as (() => void) | undefined, tileLayer: vi.fn(), polyline: vi.fn(), marker: vi.fn(), divIcon: vi.fn() }));
vi.mock('leaflet', () => ({
  default: {
    map: (...args: unknown[]) => { mocks.map(...args); return { fitBounds: mocks.fitBounds, remove: mocks.remove, invalidateSize: mocks.invalidateSize }; },
    tileLayer: (...args: unknown[]) => { mocks.tileLayer(...args); return { on: (_: string, callback: () => void) => { mocks.tileError = callback; return { addTo: vi.fn() }; } }; },
    polyline: (...args: unknown[]) => { mocks.polyline(...args); return { addTo: () => ({ getBounds: () => 'bounds' }) }; },
    marker: (...args: unknown[]) => { mocks.marker(...args); return { addTo: vi.fn() }; },
    divIcon: (options: unknown) => { mocks.divIcon(options); return options; },
    control: { scale: () => ({ addTo: vi.fn() }) },
  },
}));
beforeEach(() => { vi.clearAllMocks(); mocks.tileError = undefined; vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); });
it('dibuja el recorrido con halo, marcadores y flechas; limpia Leaflet', () => {
  const view = render(<RouteMap version={routeFixture.versiones[0]} />);
  expect(mocks.tileLayer).toHaveBeenCalledWith(expect.stringContaining('openstreetmap'), expect.any(Object));
  expect(mocks.polyline).toHaveBeenCalledTimes(2);
  expect(mocks.polyline.mock.calls[0][1]).toMatchObject({ color: '#ffffff', weight: 10 });
  expect(mocks.polyline.mock.calls[1][1]).toMatchObject({ color: '#0b6bcb', weight: 5 });
  expect(mocks.marker).toHaveBeenCalledTimes(4);
  expect(mocks.marker.mock.calls[0][1]).toMatchObject({ title: 'Origen: Origen sintético' });
  expect(mocks.marker.mock.calls[0][1]).not.toHaveProperty('draggable');
  expect(mocks.divIcon.mock.calls.some(([options]) => String((options as { html?: string }).html).includes('rotate('))).toBe(true);
  expect(mocks.fitBounds).toHaveBeenCalled();
  act(() => mocks.tileError?.());
  expect(screen.getByRole('status')).toHaveTextContent('mapa base');
  view.unmount();
  expect(mocks.remove).toHaveBeenCalled();
});
it('geometría ausente no genera una línea sustitutiva', () => {
  render(<RouteMap version={{ ...routeFixture.versiones[0], resultado: { ...routeFixture.versiones[0].resultado, geometry: { type: 'LineString', coordinates: [] } } }} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Geometría no disponible');
  expect(mocks.map).not.toHaveBeenCalled(); expect(mocks.polyline).not.toHaveBeenCalled();
});
it.each([{ coordinates: [[200, -12], [-75, -12]] }, { coordinates: [[NaN, -12], [-75, -12]] }, { coordinates: [[-75], [-75, -12]] }, { coordinates: [[-75, 100], [-75, -12]] }])('geometría corrupta produce error visible sin mapa sustituto', ({ coordinates }) => {
  render(<RouteMap version={{ ...routeFixture.versiones[0], resultado: { ...routeFixture.versiones[0].resultado, geometry: { type: 'LineString', coordinates } } }} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Geometría no disponible');
  expect(mocks.map).not.toHaveBeenCalled(); expect(mocks.polyline).not.toHaveBeenCalled();
});
const mocks = vi.hoisted(() => ({ fitBounds: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn(), tileError: undefined as (() => void) | undefined, geo: vi.fn(), marker: vi.fn() }));
vi.mock('leaflet', () => ({ default: { map: () => ({ fitBounds: mocks.fitBounds, remove: mocks.remove, invalidateSize: mocks.invalidateSize }), tileLayer: () => ({ on: (_: string, callback: () => void) => { mocks.tileError = callback; return { addTo: vi.fn() }; } }), geoJSON: mocks.geo, marker: mocks.marker, divIcon: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); mocks.geo.mockReturnValue({ addTo: () => ({ getBounds: () => 'bounds' }) }); mocks.marker.mockReturnValue({ addTo: vi.fn() }); });
it('dibuja solo geometría registrada y marcadores no arrastrables; limpia Leaflet', () => { const view = render(<RouteMap version={routeFixture.versiones[0]} />); expect(mocks.geo).toHaveBeenCalledWith(routeFixture.versiones[0].resultado.geometry, expect.any(Object)); expect(mocks.marker).toHaveBeenCalledTimes(2); expect(mocks.marker.mock.calls[0][1]).not.toHaveProperty('draggable'); expect(mocks.fitBounds).toHaveBeenCalled(); act(() => mocks.tileError?.()); expect(screen.getByRole('status')).toHaveTextContent('teselas'); view.unmount(); expect(mocks.remove).toHaveBeenCalled(); });
it('geometría ausente no genera una línea sustitutiva', () => { render(<RouteMap version={{ ...routeFixture.versiones[0], resultado: { ...routeFixture.versiones[0].resultado, geometry: { type: 'LineString', coordinates: [] } } }} />); expect(screen.getByRole('alert')).toHaveTextContent('Geometría no disponible'); expect(mocks.geo).not.toHaveBeenCalled(); });
it.each([{ coordinates: [[200, -12], [-75, -12]] }, { coordinates: [[NaN, -12], [-75, -12]] }, { coordinates: [[-75], [-75, -12]] }])('geometría corrupta produce error visible sin mapa sustituto', ({ coordinates }) => { render(<RouteMap version={{ ...routeFixture.versiones[0], resultado: { ...routeFixture.versiones[0].resultado, geometry: { type: 'LineString', coordinates } } }} />); expect(screen.getByRole('alert')).toHaveTextContent('Geometría no disponible'); expect(mocks.geo).not.toHaveBeenCalled(); });
