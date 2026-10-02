export const ORDER_PRIORITIES = ['EXPRESS', 'ESTANDAR', 'ECONOMICO'] as const;
export const PRODUCT_TYPES = ['PERECEDERO', 'NO_PERECEDERO'] as const;
export const ORDER_STATES = ['PENDIENTE'] as const;
export interface OrderQuery { search: string; estado: string; prioridad: string; tipo_producto: string; page: number; pageSize: number }
export interface OrderRead extends RegisteredOrder {
  cliente: { cliente_id: string; nombre: string; telefono: string | null; email: string | null; direccion: string; referencia: string | null; latitud: string; longitud: string; estado: string };
}
export interface OrderPage { items: OrderRead[]; total: number; page: number; pageSize: number }
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
