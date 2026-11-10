import { request } from './api';
import type { Vehicle, VehicleValues } from '../types/vehicles';
import { pageQuery, type Page } from './pagination';
export const vehiclesApi = {
  list: (page = 1, signal?: AbortSignal) => request<Page<Vehicle>>(`/vehicles?${pageQuery(page)}`, { signal }),
  create: (values: VehicleValues) => request<Vehicle>('/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
  update: (id: string, values: Partial<VehicleValues>) => request<Vehicle>(`/vehicles/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
};
