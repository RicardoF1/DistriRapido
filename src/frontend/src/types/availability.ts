export type AvailabilityState =
  | 'DISPONIBLE'
  | 'NO_DISPONIBLE';

export interface AvailabilityDriver {
  conductor_id: string;
  nombre_completo: string;
  dni: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface AvailabilityValues {
  conductor_id: string;
  inicio: string;
  fin: string;
  estado: AvailabilityState;
}

export interface AvailabilityRecord {
  disponibilidad_id: string;
  conductor_id: string;
  inicio: string;
  fin: string;
  estado: AvailabilityState;
  creado_en: string;
  actualizado_en: string;
  conductor: AvailabilityDriver;
}

export interface AvailabilityPage {
  items: AvailabilityRecord[];
  total: number;
  page: number;
  pageSize: number;
}
