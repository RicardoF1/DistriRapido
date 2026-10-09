export const VEHICLE_STATES = ['DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'AVERIADO', 'INACTIVO'] as const;
export type VehicleState = typeof VEHICLE_STATES[number];
export interface Vehicle { vehiculo_id: string; placa: string; tipo: string; capacidad_carga_kg: string; capacidad_volumen_m3: string | null; consumo_km_l: string; factor_emision_kg_co2_km: string; anio_fabricacion: number; estado: VehicleState; }
export interface VehicleValues { placa: string; tipo: string; capacidad_carga_kg: number; capacidad_volumen_m3?: number | null; consumo_km_l: number; factor_emision_kg_co2_km: number; anio_fabricacion: number; estado?: VehicleState; }
