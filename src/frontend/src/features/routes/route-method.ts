const methods: Record<string, { nombre: string; descripcion: string }> = {
  SECUENCIAL_OSRM: { nombre: 'Secuencial OSRM', descripcion: 'Recorrido único en el orden de paradas confirmado.' },
  SECUENCIAL_ORDEN: { nombre: 'Orden confirmado', descripcion: 'Respeta el orden en que seleccionaste las paradas al preparar la planificación.' },
  SECUENCIAL_VENTANA: { nombre: 'Ventana más próxima', descripcion: 'Visita primero los pedidos cuyo límite de ventana vence antes.' },
  SECUENCIAL_CERCANO: { nombre: 'Vecino más cercano', descripcion: 'En cada paso elige la parada pendiente más cercana al punto actual.' },
};
export const routeMethod = (metodo: string) => methods[metodo]?.nombre ?? metodo;
export const routeMethodDescription = (metodo: string) => methods[metodo]?.descripcion ?? '';
