export interface Origin { latitud: number; longitud: number; label: string }
export interface CandidateOrder { pedido_id: string; peso_kg: string; volumen_m3: string | null; ventana_inicio: string; ventana_fin: string; eligible: boolean; reason?: string; cliente: { direccion: string; latitud: string; longitud: string } }
export interface PlanningCandidates { items: CandidateOrder[]; total: number; page: number; pageSize: number; vehicles: { vehiculo_id: string; placa: string }[]; drivers: { conductor_id: string; nombre_completo: string }[]; resourceLimit: number }
export interface PlanningInput { etiqueta: string; origin: Origin; return_to_origin: boolean; confirm_origin: boolean; confirm_order: boolean; confirm_return: boolean; inicio: string; fin: string; vehiculo_id: string; conductor_ids: string[]; orders: { pedido_id: string; service_minutes: number }[] }
export interface PreparedPlan { planificacion_id: string; current_version: number }
export interface RouteGeometry { type: 'LineString'; coordinates: number[][] }
export interface AlternativeVersion {
  numero: number;
  distancia_m: string;
  duracion_s: string;
  origin: Origin | null;
  geometry: RouteGeometry | null;
  warnings: string[];
  end: string | null;
  operational_duration_s: number | null;
  estrategia: { codigo: string; nombre: string; descripcion: string } | null;
  orden: string[];
  confirmable: boolean;
}
export interface CalculationRoute { ruta_id: string; version?: AlternativeVersion | null; versiones?: { numero: number; distancia_m: string; duracion_s: string }[] }
export interface Calculation { ejecucion_id: string; estado: string; error_code?: string; alternativas: { alternativa_id: string; numero?: number; metodo: string; rutas: CalculationRoute[] }[]; alternativas_generadas?: number; solo_una_alternativa?: boolean }
