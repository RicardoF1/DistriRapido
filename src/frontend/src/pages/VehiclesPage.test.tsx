import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { VehiclesPage } from './VehiclesPage';
import { vehiclesApi } from '../services/vehicles-api';

vi.mock('../services/vehicles-api', () => ({ vehiclesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() } }));
const vehicle = { vehiculo_id: 'vehicle-id', placa: 'ABC-123', tipo: 'Furgón', capacidad_carga_kg: '1000', capacidad_volumen_m3: '12', consumo_km_l: '8', factor_emision_kg_co2_km: '0.25', anio_fabricacion: 2022, estado: 'DISPONIBLE' as const };
const values = { placa: 'XYZ-999', tipo: 'Camión', capacidad_carga_kg: 1500, capacidad_volumen_m3: null, consumo_km_l: 7, factor_emision_kg_co2_km: 0.3, anio_fabricacion: 2023, estado: 'DISPONIBLE' as const };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(vehiclesApi.list).mockResolvedValue([vehicle]);
  vi.mocked(vehiclesApi.create).mockResolvedValue({ ...vehicle, ...values, vehiculo_id: 'new-id', capacidad_carga_kg: '1500', capacidad_volumen_m3: null, consumo_km_l: '7', factor_emision_kg_co2_km: '0.3' });
  vi.mocked(vehiclesApi.update).mockResolvedValue({ ...vehicle, tipo: 'Camión', estado: 'MANTENIMIENTO' });
});

describe('US-007 pantalla de vehículos', () => {
  it('consulta y registra un vehículo mostrando confirmación', async () => {
    render(<MemoryRouter><VehiclesPage /></MemoryRouter>);
    expect(await screen.findByRole('cell', { name: 'ABC-123' })).toBeVisible();
    for (const [label, value] of [['Placa', values.placa], ['Tipo', values.tipo], ['Capacidad de carga (kg)', '1500'], ['Consumo (km/l)', '7'], ['Emisión (kg CO₂/km)', '0.3'], ['Año de fabricación', '2023']]) await userEvent.clear(screen.getByLabelText(label)).then(() => userEvent.type(screen.getByLabelText(label), value));
    await userEvent.click(screen.getByRole('button', { name: 'Registrar vehículo' }));
    expect(vehiclesApi.create).toHaveBeenCalledWith(expect.objectContaining(values));
    expect(await screen.findByRole('status')).toHaveTextContent('Vehículo registrado correctamente.');
  });

  it('edita información y estado operativo', async () => {
    render(<MemoryRouter><VehiclesPage /></MemoryRouter>);
    await screen.findByRole('cell', { name: 'ABC-123' });
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await userEvent.selectOptions(screen.getByLabelText('Estado operativo'), 'MANTENIMIENTO');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(vehiclesApi.update).toHaveBeenCalledWith('vehicle-id', expect.objectContaining({ estado: 'MANTENIMIENTO' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Vehículo actualizado correctamente.');
  });
});
