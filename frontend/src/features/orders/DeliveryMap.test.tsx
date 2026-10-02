import { fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { vi } from 'vitest';
import { DeliveryMap } from './DeliveryMap';

it('Leaflet requiere selección explícita, admite teclado y conserva mapa tras re-render', () => {
  const onChange = vi.fn();
  const view = render(<StrictMode><DeliveryMap onChange={onChange} disabled={false} /></StrictMode>);
  const map = screen.getByRole('region', { name: 'Mapa de ubicación de entrega' });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.keyDown(map, { key: 'Enter' });
  expect(onChange).toHaveBeenLastCalledWith({ latitud: -12.065, longitud: -75.204 });
  expect(screen.getByText('Punto de entrega seleccionado.')).toBeVisible();
  expect(map.querySelector('.delivery-marker')).not.toBeNull();
  view.rerender(<StrictMode><DeliveryMap onChange={onChange} disabled={true} /></StrictMode>);
  expect(screen.getByRole('region')).toBe(map);
  fireEvent.keyDown(map, { key: 'Enter' });
  expect(onChange).toHaveBeenCalledTimes(1);
  view.unmount();
});
it('clic en mapa genera coordenadas válidas y reutiliza el marcador', () => {
  const onChange = vi.fn(); render(<DeliveryMap onChange={onChange} disabled={false} />);
  const map = screen.getByRole('region');
  fireEvent.click(map, { clientX: 10, clientY: 10 }); fireEvent.click(map, { clientX: 20, clientY: 20 });
  expect(onChange).toHaveBeenCalledTimes(2);
  const point = onChange.mock.calls[1][0];
  expect(Number.isFinite(point.latitud)).toBe(true); expect(Math.abs(point.longitud)).toBeLessThanOrEqual(180);
  expect(map.querySelectorAll('.delivery-marker')).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument();
});
