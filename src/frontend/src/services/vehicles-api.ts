import { request } from './api';
import type { Vehicle, VehicleValues } from '../types/vehicles';
export const vehiclesApi = {
  list: (signal?: AbortSignal) => request<Vehicle[]>('/vehicles', { signal }),
  create: (values: VehicleValues) => request<Vehicle>('/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
  update: (id: string, values: Partial<VehicleValues>) => request<Vehicle>(`/vehicles/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
};
