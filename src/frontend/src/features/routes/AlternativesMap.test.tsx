import { act, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AlternativesMap } from './AlternativesMap';
import type { Calculation } from '../../types/planning';
const mocks = vi.hoisted(() => ({ map: vi.fn(), fitBounds: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn(), tileError: undefined as (() => void) | undefined, tileLayer: vi.fn(), polyline: vi.fn(), marker: vi.fn(), setStyle: vi.fn(), latLngBounds: vi.fn(), zoom: vi.fn() }));
vi.mock('leaflet', () => ({
  default: {
    map: (...args: unknown[]) => { mocks.map(...args); return { fitBounds: mocks.fitBounds, remove: mocks.remove, invalidateSize: mocks.invalidateSize }; },
    tileLayer: (...args: unknown[]) => { mocks.tileLayer(...args); return { on: (_: string, callback: () => void) => { mocks.tileError = callback; return { addTo: vi.fn() }; } }; },
    polyline: (...args: unknown[]) => { mocks.polyline(...args); const layer = { addTo: () => layer, setStyle: mocks.setStyle, getBounds: () => 'bounds' }; return layer; },
    marker: (...args: unknown[]) => { mocks.marker(...args); return { addTo: vi.fn() }; },
    divIcon: (options: unknown) => options,
    latLngBounds: (...args: unknown[]) => { mocks.latLngBounds(...args); return { bounds: true }; },
    control: { scale: () => ({ addTo: vi.fn() }), zoom: (options: unknown) => { mocks.zoom(options); return { addTo: vi.fn() }; } },
  },
}));
const version = (coordinates: number[][], label: string) => ({ numero: 1, distancia_m: '1000', duracion_s: '120', origin: { latitud: -12, longitud: -75, label }, geometry: { type: 'LineString' as const, coordinates }, warnings: [], end: null, operational_duration_s: 120, estrategia: null, orden: ['o'], confirmable: true });
const alternatives: Calculation['alternativas'] = [
  { alternativa_id: 'a1', numero: 1, metodo: 'SECUENCIAL_ORDEN', rutas: [{ ruta_id: 'r1', version: version([[-75, -12], [-75.001, -12.001]], 'Origen') }] },
  { alternativa_id: 'a2', numero: 2, metodo: 'SECUENCIAL_VENTANA', rutas: [{ ruta_id: 'r2', version: version([[-75, -12], [-75.002, -12.002]], 'Origen') }] },
];
beforeEach(() => { vi.clearAllMocks(); mocks.tileError = undefined; vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); });
it('dibuja una línea por alternativa, un origen compartido y una leyenda con colores', () => {
  const view = render(<AlternativesMap alternatives={alternatives} activeId={null} />);
  expect(mocks.tileLayer).toHaveBeenCalledWith(expect.stringContaining('openstreetmap'), expect.any(Object));
  expect(mocks.polyline).toHaveBeenCalledTimes(4);
  expect(mocks.map.mock.calls[0][1]).toMatchObject({ zoomControl: false });
  expect(mocks.zoom).toHaveBeenCalledExactlyOnceWith({ zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' });
  expect(mocks.polyline.mock.calls[0][1]).toMatchObject({ color: '#ffffff' });
  expect(mocks.polyline.mock.calls[1][1]).toMatchObject({ color: '#0b6bcb' });
  expect(mocks.polyline.mock.calls[2][1]).toMatchObject({ color: '#ffffff' });
  expect(mocks.polyline.mock.calls[3][1]).toMatchObject({ color: '#c026d3' });
  expect(mocks.marker).toHaveBeenCalledTimes(1);
  expect(mocks.fitBounds).toHaveBeenCalled();
  expect(screen.getByText('Alternativa 1')).toBeInTheDocument();
  expect(screen.getByText('Alternativa 2')).toBeInTheDocument();
  view.rerender(<AlternativesMap alternatives={alternatives} activeId="a2" />);
  expect(mocks.map).toHaveBeenCalledTimes(1);
  expect(mocks.setStyle).toHaveBeenCalledWith(expect.objectContaining({ opacity: .18 }));
  expect(mocks.setStyle).toHaveBeenCalledWith(expect.objectContaining({ opacity: 1, weight: 6 }));
  view.unmount();
  expect(mocks.remove).toHaveBeenCalled();
});
it('advierte cuando no hay geometrías y no crea un mapa sustituto', () => {
  const broken = [{ ...alternatives[0], rutas: [{ ruta_id: 'r1', version: { ...version([], 'Origen') } }] }];
  render(<AlternativesMap alternatives={broken} />);
  expect(screen.getByRole('alert')).toHaveTextContent('No hay geometrías disponibles');
  expect(mocks.map).not.toHaveBeenCalled();
});
it('informa si falla el mapa base', () => {
  render(<AlternativesMap alternatives={alternatives} />);
  act(() => mocks.tileError?.());
  expect(screen.getByRole('status')).toHaveTextContent('mapa base');
});
