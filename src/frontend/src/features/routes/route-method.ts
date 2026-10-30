const methods: Record<string, string> = { SECUENCIAL_OSRM: 'Secuencial OSRM', SECUENCIAL_ORDEN: 'Orden confirmado', SECUENCIAL_VENTANA: 'Ventana más próxima', SECUENCIAL_CERCANO: 'Vecino más cercano' };
export const routeMethod = (metodo: string) => methods[metodo] ?? metodo;
