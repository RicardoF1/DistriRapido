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
  await waitFor(() => expect(result.current.coverage).not.toBeNull());
  act(() => { void result.current.move({ latitud: 1, longitud: 1 }); });
  act(() => result.current.edit('Manual'));
  await act(async () => resolve('Respuesta antigua'));
  expect(update).toHaveBeenLastCalledWith('Manual'); expect(result.current.confirmed).toBe(false);
  expect(result.current.point).toEqual({ latitud: 1, longitud: 1 });
});

it('un arrastre espera la dirección inversa y un fallo elimina la confirmación anterior', async () => {
  const update = vi.fn(); const { result } = renderHook(() => useDeliveryAddress(update));
  await waitFor(() => expect(result.current.coverage).not.toBeNull());
  act(() => result.current.choose({ address: 'Plaza Constitución', latitud: 1, longitud: 1 }));
  expect(result.current.confirmed).toBe(true);
  let reject!: (reason: Error) => void;
  vi.mocked(geocoding.reverse).mockReturnValue(new Promise((_, fail) => { reject = fail; }));
  let moving!: Promise<void>;
  act(() => { moving = result.current.move({ latitud: 2, longitud: 2 }); });
  expect(result.current.confirmed).toBe(false);
  await act(async () => { reject(new Error('Photon offline')); await moving; });
  expect(result.current.confirmed).toBe(false); expect(result.current.status).toMatch(/no está confirmada/);
  expect(update).toHaveBeenLastCalledWith('Plaza Constitución');
});

it('selección y arrastre fuera de cobertura invalidan el punto sin consulta inversa', async () => {
  const update = vi.fn(); const { result } = renderHook(() => useDeliveryAddress(update));
  await waitFor(() => expect(result.current.coverage).not.toBeNull());
  vi.mocked(geocoding.reverse).mockResolvedValue('Dirección autorizada');
  await act(async () => { await result.current.move({ latitud: 2, longitud: 2 }); });
  expect(result.current.confirmed).toBe(true);
  vi.mocked(geocoding.reverse).mockClear();
  await act(async () => { await result.current.move({ latitud: 20, longitud: 40 }); });
  expect(result.current.confirmed).toBe(false); expect(result.current.status).toMatch(/fuera de cobertura/);
  expect(geocoding.reverse).not.toHaveBeenCalled();
  act(() => result.current.choose({ address: 'El Tambo, Jauja', latitud: 20, longitud: 40 }));
  expect(result.current.confirmed).toBe(false); expect(update).not.toHaveBeenCalledWith('El Tambo, Jauja');
});
