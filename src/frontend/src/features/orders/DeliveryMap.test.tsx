import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { vi } from 'vitest';
import { DeliveryMap } from './DeliveryMap';
import L from 'leaflet';
import { districtAt, loadCoverage } from '../../services/coverage';
async function ready() { await waitFor(() => expect(screen.getByRole('button', { name: 'Ver cobertura' })).toBeEnabled()); }
it('sugerencia centra mapa; dragend fuera de cobertura invalida selección', async () => {
  const markerSpy = vi.spyOn(L, 'marker'); const viewSpy = vi.spyOn(L.Map.prototype, 'setView');
  const onChange = vi.fn();
  render(<DeliveryMap disabled={false} onChange={onChange} point={{ latitud: 1, longitud: 1 }} />);
  await ready();
  const marker = markerSpy.mock.results.at(-1)!.value as L.Marker;
  expect(marker.getLatLng()).toMatchObject({ lat: 1, lng: 1 });
  expect(viewSpy).toHaveBeenCalledWith([1, 1], 17); expect(onChange).not.toHaveBeenCalled();
  marker.setLatLng([20, 40]); marker.fire('drag'); expect(onChange).not.toHaveBeenCalled();
  act(() => { marker.fire('dragend'); }); expect(onChange).toHaveBeenCalledExactlyOnceWith({ latitud: 20, longitud: 40 });
  expect(screen.getByText(/Ubicación fuera de cobertura/)).toBeVisible();
  expect(marker.getElement()).toHaveClass('delivery-marker-outside');
  markerSpy.mockRestore(); viewSpy.mockRestore();
});
it('StrictMode conserva mapa; teclado selecciona centro y disabled impide cambios', async () => {
  const mapSpy = vi.spyOn(L, 'map');
  const onChange = vi.fn(); const view = render(<StrictMode><DeliveryMap onChange={onChange} disabled={false} /></StrictMode>);
  await ready(); const map = screen.getByRole('region', { name: 'Mapa de ubicación de entrega' });
  // jsdom has no layout; explicitly position the real Leaflet instance before testing Enter.
  const instance = mapSpy.mock.results.at(-1)!.value as L.Map;
  act(() => { instance.setView([2, 2], 17, { animate: false }); });
  expect(onChange).not.toHaveBeenCalled(); fireEvent.keyDown(map, { key: 'Enter' });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(districtAt(await loadCoverage(), onChange.mock.calls[0][0])).not.toBeNull();
  expect(screen.getByText('Punto de entrega seleccionado.')).toBeVisible();
  view.rerender(<StrictMode><DeliveryMap onChange={onChange} disabled={true} /></StrictMode>);
  expect(screen.getByRole('region')).toBe(map); fireEvent.keyDown(map, { key: 'Enter' }); expect(onChange).toHaveBeenCalledTimes(1); mapSpy.mockRestore();
});
it('dibuja cinco distritos y Ver cobertura reajusta vista sin reiniciar marcador', async () => {
  const fit = vi.spyOn(L.Map.prototype, 'fitBounds'); const onChange = vi.fn();
  render(<DeliveryMap onChange={onChange} disabled={false} point={{ latitud: 2, longitud: 2 }} />);
  await ready(); const map = screen.getByRole('region');
  expect(screen.getByRole('list', { name: 'Distritos autorizados' }).children).toHaveLength(5);
  const marker = map.querySelector('.delivery-marker');
  fireEvent.click(screen.getByRole('button', { name: 'Ver cobertura' }));
  expect(fit).toHaveBeenCalledTimes(2); expect(map.querySelector('.delivery-marker')).toBe(marker);
  fireEvent.click(map, { clientX: 10, clientY: 10 }); fireEvent.click(map, { clientX: 20, clientY: 20 });
  expect(onChange).toHaveBeenCalledTimes(2); expect(map.querySelectorAll('.delivery-marker')).toHaveLength(1);
  fit.mockRestore();
});

it('volver a elegir la misma sugerencia centra y acerca incluso después de Ver cobertura', async () => {
  const setView = vi.spyOn(L.Map.prototype, 'setView');
  const point = { latitud: 1, longitud: 1 };
  const view = render(<DeliveryMap disabled={false} onChange={vi.fn()} point={point} focusRevision={1} confirmed />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'Ver cobertura' }));
  setView.mockClear();
  view.rerender(<DeliveryMap disabled={false} onChange={vi.fn()} point={{ ...point }} focusRevision={2} confirmed />);
  expect(setView).toHaveBeenCalledWith([1, 1], 17);
  expect(screen.getByRole('region').querySelectorAll('.delivery-marker')).toHaveLength(1);
  view.rerender(<DeliveryMap disabled={false} onChange={vi.fn()} point={point} focusRevision={2} confirmed={false} />);
  expect(screen.getByRole('region').querySelector('.delivery-marker')).toHaveClass('delivery-marker-unconfirmed');
  setView.mockRestore();
});
