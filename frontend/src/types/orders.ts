export const ORDER_PRIORITIES = ['EXPRESS', 'ESTANDAR', 'ECONOMICO'] as const;
export const PRODUCT_TYPES = ['PERECEDERO', 'NO_PERECEDERO'] as const;
export interface OrderValues {
  cliente: { nombre: string; direccion: string; referencia?: string; latitud: number; longitud: number };
  descripcion_carga?: string;
  peso_kg: number; volumen_m3?: number | null; ventana_inicio: string; ventana_fin: string;
  prioridad: string; tipo_producto: string;
}
export interface RegisteredOrder {
  pedido_id: string; cliente_id: string; estado: 'PENDIENTE'; creado_en: string;
  descripcion_carga?: string | null;
  peso_kg: string; volumen_m3: string | null; ventana_inicio: string; ventana_fin: string;
  prioridad: string; tipo_producto: string;
}
