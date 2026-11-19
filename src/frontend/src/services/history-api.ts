import { request } from './api';
import type { DeliveryIncident } from './driver-profile-api';
import type { DeliveryState } from './operations-api';
import { PAGE_SIZE } from './pagination';

// US-023 / RF-021: historial de operaciones terminadas (rutas completadas), de solo lectura.
export interface HistoryFilters {
  desde?: string;
  hasta?: string;
  search?: string;
  con_incidencias?: boolean;
  con_no_entregas?: boolean;
}
export interface HistoryDeliveries { total: number; realizadas: number; no_realizadas: number }
export interface HistoryItem {
  ruta_id: string;
  iniciado_en: string | null;
  finalizado_en: string;
  planificacion: { planificacion_id: string; etiqueta: string };
  conductor: { conductor_id: string; nombre_completo: string } | null;
  vehiculo: { vehiculo_id: string; placa: string } | null;
  entregas: HistoryDeliveries;
  incidencias: number;
  con_sostenibilidad: boolean;
}
export interface HistoryPage { items: HistoryItem[]; total: number; page: number; pageSize: number }
export interface HistoryStop {
  parada_id: string;
  pedido_id: string;
  secuencia: number;
  direccion: string | null;
  estado_entrega: DeliveryState;
  causa_no_entrega: string | null;
  atendido_en: string | null;
  incidencias: DeliveryIncident[];
}
export interface HistorySustainability {
  ruta_version: number;
  distancia_km: string;
  combustible_l: string;
  factor_emision_kg_co2_km: string;
  emisiones_co2_kg: string;
  origen_datos: 'ESTIMADO' | 'MEDIDO';
  costo_combustible: string | null;
  observaciones: string | null;
  registrado_en: string;
  registrador: { email: string } | null;
}
export interface HistoryDetail {
  ruta_id: string;
  estado: 'COMPLETADA';
  creado_en: string;
  confirmado_en: string | null;
  confirmado_por: string | null;
  version_confirmada: number | null;
  asignado_en: string | null;
  iniciado_en: string | null;
  finalizado_en: string;
  current_version: number;
  planificacion: { planificacion_id: string; etiqueta: string; version: number };
  conductor: { conductor_id: string; nombre_completo: string } | null;
  version: { numero: number; distancia_m: string; duracion_s: string; vehiculo: { vehiculo_id: string; placa: string; tipo: string } };
  entregas: HistoryDeliveries;
  incidencias: number;
  sostenibilidad: HistorySustainability | null;
  paradas: HistoryStop[];
}

export function historyQuery(filters: HistoryFilters, page: number, pageSize = PAGE_SIZE) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.desde) params.set('desde', filters.desde);
  if (filters.hasta) params.set('hasta', filters.hasta);
  const search = filters.search?.trim();
  if (search) params.set('search', search);
  if (filters.con_incidencias) params.set('con_incidencias', 'true');
  if (filters.con_no_entregas) params.set('con_no_entregas', 'true');
  return params.toString();
}

export const historyApi = {
  list: (filters: HistoryFilters, page: number, signal?: AbortSignal) => request<HistoryPage>(`/operations/history?${historyQuery(filters, page)}`, { signal }),
  detail: (id: string, signal?: AbortSignal) => request<HistoryDetail>(`/operations/history/${encodeURIComponent(id)}`, { signal }),
};
