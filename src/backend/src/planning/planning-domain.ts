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
