import type { RouteState } from '../../types/routes';

/** Ciclo de US-020: GENERADA -> CONFIRMADA -> ASIGNADA -> EN_CURSO -> COMPLETADA. */
export const ROUTE_STATE_LABELS: Record<RouteState, string> = {
  GENERADA: 'Generada',
  CONFIRMADA: 'Confirmada',
  ASIGNADA: 'Asignada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
};
