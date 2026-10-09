export const ORDER_STATES = ['PENDIENTE', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'CANCELADO'] as const;
export type OrderState = typeof ORDER_STATES[number];

export const ORDER_TRANSITIONS: Record<OrderState, readonly OrderState[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['EN_RUTA', 'CANCELADO'],
  EN_RUTA: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export function isAllowedOrderTransition(from: string, to: OrderState): boolean {
  return (ORDER_TRANSITIONS[from as OrderState] ?? []).includes(to);
}
