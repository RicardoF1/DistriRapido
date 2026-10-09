const lima = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
export function formatOrderDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  const parts = Object.fromEntries(lima.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
}
export const orderLabel = (value: string) => ({ PENDIENTE: 'Pendiente', EN_PREPARACION: 'En preparación', EN_RUTA: 'En ruta', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado', EXPRESS: 'Express', ESTANDAR: 'Estándar', ECONOMICO: 'Económico', PERECEDERO: 'Perecedero', NO_PERECEDERO: 'No perecedero' })[value] ?? value;
