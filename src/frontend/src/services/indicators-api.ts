import { request } from './api';
import type { IncidentType } from './driver-profile-api';

// US-022 / RF-020: indicadores de las rutas completadas en un periodo (solo lectura).
// Un indicador null significa «sin datos suficientes»; nunca se sustituye por 0.
export interface IndicatorsPeriod { desde?: string; hasta?: string }
export interface Indicators {
  periodo: { desde: string; hasta: string };
  datos_suficientes: boolean;
  operacion: {
    rutas_completadas: number;
    entregas: { realizadas: number; no_realizadas: number; pendientes: number; tasa_exito: number | null };
    incidencias: { total: number; por_tipo: Record<IncidentType, number> };
    duracion_media_min: number | null;
  };
  sostenibilidad: {
    rutas_con_registro: number;
    cobertura: number | null;
    distancia_km: number | null;
    combustible_l: number | null;
    co2_kg: number | null;
    co2_por_entrega_kg: number | null;
    costo_combustible: number | null;
    registros_con_costo: number;
    origen: { ESTIMADO: number; MEDIDO: number };
  };
}

export function indicatorsQuery(period: IndicatorsPeriod) {
  const params = new URLSearchParams();
  if (period.desde) params.set('desde', period.desde);
  if (period.hasta) params.set('hasta', period.hasta);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const indicatorsApi = {
  get: (period: IndicatorsPeriod, signal?: AbortSignal) => request<Indicators>(`/operations/indicators${indicatorsQuery(period)}`, { signal }),
};
