import { request } from './api';

export interface DriverProfile {
  conductor_id: string;
  nombre_completo: string;
  estado: string;
}
export interface DriverVehicle { vehiculo_id: string; placa: string; tipo: string }
export interface DriverProgress { total: number; processed: number; percentage: number }
export interface DriverRouteSummary {
  ruta_id: string;
  estado: 'ASIGNADA' | 'EN_CURSO' | 'COMPLETADA';
  asignado_en: string;
  iniciado_en: string | null;
  current_version: number;
  version: null | { ruta_version_id: string; numero: number; distancia_m: string; duracion_s: string; resultado: unknown; vehiculo: DriverVehicle };
  progress: DriverProgress;
}
export interface DriverDelivery {
  parada_id: string;
  pedido_id: string;
  secuencia: number;
  datos: { direccion?: string; arrival?: string; departure?: string; service_minutes?: number };
  estado_entrega: 'PENDIENTE' | 'ENTREGADA' | 'NO_ENTREGADA';
  causa_no_entrega: string | null;
  atendido_en: string | null;
  actualizado_en: string;
  version_entrega: number;
}
export interface DriverRouteDetail extends Omit<DriverRouteSummary, 'version'> {
  finalizado_en: string | null;
  version: { ruta_version_id: string; numero: number; distancia_m: string; duracion_s: string; resultado: unknown; vehiculo: DriverVehicle; paradas: DriverDelivery[] };
}
export interface DeliveryUpdateResult {
  delivery: Pick<DriverDelivery, 'parada_id' | 'pedido_id' | 'estado_entrega' | 'causa_no_entrega' | 'atendido_en' | 'actualizado_en' | 'version_entrega'>;
  route: { ruta_id: string; estado: 'EN_CURSO' | 'COMPLETADA' };
  progress: DriverProgress & { delivered: number; not_delivered: number };
}
export const driverProfileApi = {
  me: (signal?: AbortSignal) => request<DriverProfile>('/driver/me', { signal }),
  routes: (signal?: AbortSignal) => request<DriverRouteSummary[]>('/driver/routes', { signal }),
  route: (id: string, signal?: AbortSignal) => request<DriverRouteDetail>(`/driver/routes/${encodeURIComponent(id)}`, { signal }),
  updateDelivery: (id: string, values: { estado: 'ENTREGADA' | 'NO_ENTREGADA'; causa?: string; expected_version: number }) => request<DeliveryUpdateResult>(`/driver/deliveries/${encodeURIComponent(id)}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
};