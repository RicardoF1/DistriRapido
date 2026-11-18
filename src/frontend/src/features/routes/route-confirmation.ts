import type { RouteDetail } from '../../types/routes';

type Version = RouteDetail['versiones'][number];

/**
 * Condiciones que la interfaz puede anticipar antes de confirmar (US-020).
 * El backend es la autoridad: además comprueba que el vehículo y los pedidos no estén en otra ruta activa.
 */
export function confirmationPending(data: Pick<RouteDetail, 'current_warnings'>, version: Version): string[] {
  const outdated = data.current_warnings.filter(code => code.startsWith('PEDIDO_DESACTUALIZADO:')).length;
  return [
    ...(version.resultado.confirmable ? [] : ['La versión actual no es confirmable: revisa las restricciones del cálculo.']),
    ...(version.resultado.end ? [] : ['La versión actual no tiene la jornada calculada.']),
    ...(outdated ? [`${outdated === 1 ? 'Un pedido cambió' : `${outdated} pedidos cambiaron`} desde el cálculo (estado, cliente, dirección, carga o ventana horaria).`] : []),
    ...(data.current_warnings.includes('FUENTES_DESACTUALIZADAS') ? ['Los datos usados en el cálculo cambiaron; genera una nueva planificación.'] : []),
    ...(data.current_warnings.includes('RECURSOS_O_PEDIDOS_NO_DISPONIBLES') ? ['El vehículo, los conductores o los pedidos del cálculo ya no están disponibles.'] : []),
  ];
}
