import { request } from './api';

export interface DriverProfile {
  conductor_id: string;
  nombre_completo: string;
  estado: string;
}
export const driverProfileApi = {
  me: (signal?: AbortSignal) => request<DriverProfile>('/driver/me', { signal }),
};
