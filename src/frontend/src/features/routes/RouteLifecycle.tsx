import type { RouteState } from '../../types/routes';
import { ROUTE_STATE_LABELS } from './route-states';

// Ciclo de una ruta (US-020): GENERADA → CONFIRMADA → ASIGNADA → EN_CURSO → COMPLETADA.
const STEPS: RouteState[] = ['GENERADA', 'CONFIRMADA', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA'];
export const NEXT_STEP: Record<RouteState, string> = {
  GENERADA: 'Revisa el recorrido y confírmalo para habilitar su asignación.',
  CONFIRMADA: 'Asigna un conductor disponible para su ejecución.',
  ASIGNADA: 'El conductor iniciará la ruta al registrar su primera entrega.',
  EN_CURSO: 'El conductor está registrando las entregas.',
  COMPLETADA: 'Ruta terminada. Registra o consulta su información de sostenibilidad.',
};

/** Barra de progreso del ciclo de la ruta, con el paso actual anunciado (aria-current="step"). */
export function RouteLifecycle({ state }: Readonly<{ state: RouteState }>) {
  const current = STEPS.indexOf(state);
  return <div className="route-lifecycle">
    <ol className="lifecycle-steps" aria-label="Ciclo de la ruta">
      {STEPS.map((step, index) => {
        const status = index < current ? 'done' : index === current ? 'current' : 'pending';
        return <li key={step} className={`lifecycle-step is-${status}`} aria-current={status === 'current' ? 'step' : undefined}>
          <span className="lifecycle-marker" aria-hidden="true">{status === 'done' ? '✓' : index + 1}</span>
          <span className="lifecycle-label">{ROUTE_STATE_LABELS[step]}</span>
          {status === 'done' && <span className="sr-only"> (completado)</span>}
        </li>;
      })}
    </ol>
    <p className="lifecycle-next"><strong>Siguiente paso:</strong> {NEXT_STEP[state]}</p>
  </div>;
}
