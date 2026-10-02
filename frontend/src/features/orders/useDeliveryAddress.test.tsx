import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { geocoding } from '../../services/geocoding';
import { useDeliveryAddress } from './useDeliveryAddress';
vi.mock('../../services/geocoding', () => ({ geocoding: { search: vi.fn(), reverse: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
it('omite cadenas cortas y muestra sin resultados/error', async () => {
  const { result } = renderHook(() => useDeliveryAddress(vi.fn()));
  act(() => result.current.edit('Av'));
  await new Promise(resolve => setTimeout(resolve, 750));
  expect(geocoding.search).not.toHaveBeenCalled();
  vi.mocked(geocoding.search).mockResolvedValue([]);
  act(() => result.current.edit('Av Giráldez'));
  await waitFor(() => expect(result.current.status).toMatch(/Sin resultados/));
  vi.mocked(geocoding.search).mockRejectedValue(new Error('offline'));
  act(() => result.current.edit('Otra calle'));
  await waitFor(() => expect(result.current.status).toMatch(/Error de búsqueda/));
});
it('una respuesta inversa tardía no reemplaza una edición manual', async () => {
  let resolve!: (address: string) => void;
  vi.mocked(geocoding.reverse).mockReturnValue(new Promise(done => { resolve = done; }));
  const update = vi.fn(); const { result } = renderHook(() => useDeliveryAddress(update));
  act(() => { void result.current.move({ latitud: -12.07, longitud: -75.21 }); });
  act(() => result.current.edit('Manual'));
  await act(async () => resolve('Respuesta antigua'));
  expect(update).toHaveBeenLastCalledWith('Manual'); expect(result.current.confirmed).toBe(false);
  expect(result.current.point).toEqual({ latitud: -12.07, longitud: -75.21 });
});
