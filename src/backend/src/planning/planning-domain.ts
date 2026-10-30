import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
export interface Point { latitud: number; longitud: number }
export interface PreparedSnapshot {
  origin: Point & { label: string }; return_to_origin: boolean; inicio: string; fin: string;
  orders: (Point & { pedido_id: string; cliente_id: string; direccion: string; peso_kg: number; volumen_m3: number | null; ventana_inicio: string; ventana_fin: string; service_minutes: number })[];
  vehicle: { vehiculo_id: string; capacidad_carga_kg: number; capacidad_volumen_m3: number | null };
  drivers: { conductor_id: string; intervals: { disponibilidad_id: string; inicio: string; fin: string }[] }[];
  source_hash: string; coverage: { version: string; hash: string };
}
function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
  return value;
}
export const makeHash = (value: unknown) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function validateSequence(ids: string[]) { if (!ids.length || ids.length > 30 || new Set(ids).size !== ids.length) throw new BadRequestException('Selecciona de 1 a 30 pedidos diferentes y confirma su orden.'); }
export interface RouteCandidate {
  codigo: string; metodo: string; nombre: string; descripcion: string; orders: PreparedSnapshot['orders'];
}
const gapMeters = (a: Point, b: Point) => { const rad = Math.PI / 180; const dlat = (b.latitud - a.latitud) * rad; const dlon = (b.longitud - a.longitud) * rad; return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(dlat / 2) ** 2 + Math.cos(a.latitud * rad) * Math.cos(b.latitud * rad) * Math.sin(dlon / 2) ** 2))); };
const strategy = (codigo: string, metodo: string, nombre: string, descripcion: string, orders: PreparedSnapshot['orders']): RouteCandidate => ({ codigo, metodo, nombre, descripcion, orders });
// US-011: solo propone órdenes de paradas; las métricas viales siempre las calcula OSRM sobre el orden propuesto.
export function routeCandidates(s: PreparedSnapshot): RouteCandidate[] {
  if (!s.orders.length) return [];
  const ventana = [...s.orders].sort((a, b) => Date.parse(a.ventana_fin) - Date.parse(b.ventana_fin) || Date.parse(a.ventana_inicio) - Date.parse(b.ventana_inicio) || a.pedido_id.localeCompare(b.pedido_id));
  const pendientes = [...s.orders]; const cercano: PreparedSnapshot['orders'] = []; let actual: Point = s.origin;
  while (pendientes.length) {
    let best = 0;
    for (let i = 1; i < pendientes.length; i++) { const d = gapMeters(actual, pendientes[i]); const chosen = gapMeters(actual, pendientes[best]); if (d < chosen || d === chosen && pendientes[i].pedido_id.localeCompare(pendientes[best].pedido_id) < 0) best = i; }
    const [next] = pendientes.splice(best, 1); cercano.push(next); actual = next;
  }
  const candidates = [
    strategy('ORDEN_CONFIRMADO', 'SECUENCIAL_ORDEN', 'Orden confirmado', 'Respeta el orden de paradas confirmado al preparar la planificación.', s.orders),
    strategy('VENTANA_LIMITE', 'SECUENCIAL_VENTANA', 'Ventana más próxima', 'Atiende primero los pedidos cuyo límite de ventana vence antes.', ventana),
    strategy('CERCANO_ORIGEN', 'SECUENCIAL_CERCANO', 'Vecino más cercano', 'Propone en cada paso la parada pendiente más cercana en línea recta al punto actual; OSRM calcula las métricas viales del orden resultante.', cercano),
  ];
  const seen = new Set<string>();
  return candidates.filter(candidate => { const key = candidate.orders.map(o => o.pedido_id).join('|'); if (seen.has(key)) return false; seen.add(key); return true; });
}
export function evaluateRoute(s: PreparedSnapshot, legs: { distance_m: number; duration_s: number }[]) {
  const warnings: string[] = []; let time = Date.parse(s.inicio);
  const expected = s.orders.length + (s.return_to_origin ? 1 : 0);
  if (legs.length !== expected) throw new BadRequestException('La cantidad de tramos no coincide con las paradas.');
  const stops = s.orders.map((order, i) => {
    time += legs[i].duration_s * 1000; const arrival = new Date(time).toISOString();
    time = Math.max(time, Date.parse(order.ventana_inicio)); const service_start = new Date(time).toISOString();
    if (time > Date.parse(order.ventana_fin)) warnings.push('VENTANA_INCUMPLIDA');
    time += order.service_minutes * 60000;
    return { ...order, sequence: i + 1, arrival, service_start, departure: new Date(time).toISOString(), ...legs[i] };
  });
  if (s.return_to_origin) time += legs[legs.length - 1].duration_s * 1000;
  if (s.orders.reduce((sum, o) => sum + o.peso_kg, 0) > s.vehicle.capacidad_carga_kg) warnings.push('CAPACIDAD_PESO');
  if (s.vehicle.capacidad_volumen_m3 === null || s.orders.some(o => o.volumen_m3 === null)) warnings.push('VOLUMEN_NO_EVALUABLE');
  else if (s.orders.reduce((sum, o) => sum + o.volumen_m3!, 0) > s.vehicle.capacidad_volumen_m3) warnings.push('CAPACIDAD_VOLUMEN');
  if (time > Date.parse(s.fin)) warnings.push('JORNADA_EXCEDIDA');
  if (!s.drivers.some(d => d.intervals.some(x => Date.parse(x.inicio) <= Date.parse(s.inicio) && Date.parse(x.fin) >= time))) warnings.push('SIN_DISPONIBILIDAD_COMPLETA');
  return { stops, end: new Date(time).toISOString(), operational_duration_s: (time - Date.parse(s.inicio)) / 1000, warnings: [...new Set(warnings)], confirmable: warnings.length === 0 };
}
