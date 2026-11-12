import { request } from './api';
import type { DeliveryIncident } from './driver-profile-api';
import { PAGE_SIZE } from './pagination';

// US-019 / RF-016: seguimiento operativo de rutas y entregas (solo lectura).
export const OPERATIONAL_ROUTE_STATES = ['ASIGNADA', 'EN_CURSO', 'COMPLETADA'] as const;
export type OperationalRouteState = typeof OPERATIONAL_ROUTE_STATES[number];
export const DELIVERY_STATES = ['PENDIENTE', 'ENTREGADA', 'NO_ENTREGADA'] as const;
export type DeliveryState = typeof DELIVERY_STATES[number];
export const ROUTE_STATE_LABELS: Record<OperationalRouteState, string> = { ASIGNADA: 'Asignada', EN_CURSO: 'En curso', COMPLETADA: 'Completada' };
export const DELIVERY_STATE_LABELS: Record<DeliveryState, string> = { PENDIENTE: 'Pendiente', ENTREGADA: 'Entregada', NO_ENTREGADA: 'No entregada' };

export interface OperationsFilters {
  estado?: OperationalRouteState;
  estado_entrega?: DeliveryState;
  desde?: string;
  hasta?: string;
  con_incidencias?: boolean;
  search?: string;
}
export interface DeliveryCounters { total: number; pending: number; delivered: number; not_delivered: number; processed: number; percentage: number }
interface RouteBase {
  ruta_id: string;
  estado: OperationalRouteState;
  asignado_en: string | null;
  iniciado_en: string | null;
  finalizado_en: string | null;
  current_version: number;
  deliveries: DeliveryCounters;
  incidents: number;
}
export interface OperationalRoute extends RouteBase {
  conductor: { conductor_id: string; nombre_completo: string } | null;
  version: { numero: number; distancia_m: string; duracion_s: string; vehiculo: { vehiculo_id: string; placa: string; tipo: string } } | null;
}
export interface OperationalStop {
  parada_id: string;
  pedido_id: string;
  secuencia: number;
  direccion: string | null;
  estado_entrega: DeliveryState;
  causa_no_entrega: string | null;
  atendido_en: string | null;
  pedido_estado: string;
  incidencias: DeliveryIncident[];
}
export interface OperationalRouteDetail extends RouteBase {
  conductor: { conductor_id: string; nombre_completo: string; telefono: string } | null;
  version: NonNullable<OperationalRoute['version']>;
  stops: OperationalStop[];
}
export interface OperationsPage { items: OperationalRoute[]; total: number; page: number; pageSize: number }
export interface OperationsSummary { routes: Record<OperationalRouteState, number>; deliveries: Record<DeliveryState, number>; incidents: number }

export function operationsQuery(filters: OperationsFilters, page: number, pageSize = PAGE_SIZE) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.estado) params.set('estado', filters.estado);
  if (filters.estado_entrega) params.set('estado_entrega', filters.estado_entrega);
  if (filters.desde) params.set('desde', filters.desde);
  if (filters.hasta) params.set('hasta', filters.hasta);
  if (filters.con_incidencias) params.set('con_incidencias', 'true');
  const search = filters.search?.trim();
  if (search) params.set('search', search);
  return params.toString();
}

export const operationsApi = {
  summary: (signal?: AbortSignal) => request<OperationsSummary>('/operations/summary', { signal }),
  list: (filters: OperationsFilters, page: number, signal?: AbortSignal) => request<OperationsPage>(`/operations/routes?${operationsQuery(filters, page)}`, { signal }),
  detail: (id: string, signal?: AbortSignal) => request<OperationalRouteDetail>(`/operations/routes/${encodeURIComponent(id)}`, { signal }),
};
