import { BadGatewayException, GatewayTimeoutException, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import type { Point } from '../planning/planning-domain';
export interface RoutingConfig { baseUrl: string; profile: string; revision: string; timeoutMs: number; maxSnapM: number; totalTimeoutMs?: number; allowedOrigin?: string; unavailableReason?: string }
export interface RoutingResult { geometry: { type: 'LineString'; coordinates: number[][] }; distance_m: number; duration_s: number; legs: { distance_m: number; duration_s: number }[]; snapped: Point[]; provenance: { provider: 'OSRM'; profile: string; revision: string; data_version: string | null; calculated_at: string; parameters?: { timeout_ms: number; total_timeout_ms: number; max_snap_m: number } } }
const object = (value: unknown): Record<string, unknown> => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object'); return value as Record<string, unknown>; };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
function coordinate(v: unknown): number[] { if (!Array.isArray(v) || v.length !== 2 || !v.every(x => typeof x === 'number' && Number.isFinite(x)) || Math.abs(v[0]) > 180 || Math.abs(v[1]) > 90) throw new Error('coordinate'); return v as number[]; }
function gap(a: Point, b: Point) { const rad = Math.PI / 180; const dlat = (b.latitud - a.latitud) * rad; const dlon = (b.longitud - a.longitud) * rad; return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(dlat / 2) ** 2 + Math.cos(a.latitud * rad) * Math.cos(b.latitud * rad) * Math.sin(dlon / 2) ** 2))); }
export class OsrmAdapter {
  constructor(private readonly config: RoutingConfig, private readonly fetcher: typeof fetch = fetch) {}
  get totalTimeoutMs() { return this.config.totalTimeoutMs ?? 20000; }
  async calculate(points: Point[], signal?: AbortSignal): Promise<RoutingResult> {
    if (!this.config.baseUrl) throw new ServiceUnavailableException(this.config.unavailableReason ?? 'OSRM no está configurado. No se puede calcular un recorrido.');
    let base: URL;
    try { base = new URL(this.config.baseUrl); if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || this.config.allowedOrigin && base.origin !== this.config.allowedOrigin || !/^[a-zA-Z0-9_-]+$/.test(this.config.profile)) throw new Error(); } catch { throw new ServiceUnavailableException('Configuración de OSRM inválida.'); }
    if (points.length < 2 || points.length > 32) throw new UnprocessableEntityException('Cantidad de puntos no permitida.');
    const url = new URL(base.toString().replace(/\/$/, '') + '/route/v1/' + this.config.profile + '/' + points.map(p => `${p.longitud},${p.latitud}`).join(';'));
    url.search = new URLSearchParams({ geometries: 'geojson', overview: 'full', steps: 'false', alternatives: 'false', radiuses: points.map(() => String(this.config.maxSnapM)).join(';') }).toString();
    const timeout = AbortSignal.timeout(this.config.timeoutMs); const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await this.fetcher(url, { signal: combined, redirect: 'error', headers: { Accept: 'application/json', 'User-Agent': 'DistriRapido-Routing/1.0' } });
      if (Number(response.headers.get('content-length')) > 4000000) throw new Error('size');
      let text = ''; const reader = response.body?.getReader();
      if (!reader) throw new Error('body');
      try { const chunks: Uint8Array[] = []; let size = 0; for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 4000000) throw new Error('size'); chunks.push(value); } text = Buffer.concat(chunks).toString('utf8'); } finally { await reader.cancel().catch(() => undefined); }
      const data = object(JSON.parse(text));
      if (['NoRoute', 'NoSegment'].includes(String(data.code))) throw new UnprocessableEntityException('No existe un recorrido vial conectable para los puntos elegidos.');
      if (!response.ok || data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length !== 1 || !Array.isArray(data.waypoints) || data.waypoints.length !== points.length) throw new Error('response');
      const route = object(data.routes[0]); const geometry = object(route.geometry);
      if (!finite(route.distance) || !finite(route.duration) || geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2 || geometry.coordinates.length > 100000 || !Array.isArray(route.legs) || route.legs.length !== points.length - 1) throw new Error('route');
      const coordinates = geometry.coordinates.map(coordinate);
      const snapped = data.waypoints.map((raw, i) => { const waypoint = object(raw); const location = coordinate(waypoint.location); const point = { latitud: location[1], longitud: location[0] }; if (!finite(waypoint.distance) || waypoint.distance > this.config.maxSnapM || gap(points[i], point) > this.config.maxSnapM + 1) throw new UnprocessableEntityException('El punto está demasiado alejado de una vía accesible.'); return point; });
      if (gap(snapped[0], { longitud: coordinates[0][0], latitud: coordinates[0][1] }) > 10 || gap(snapped.at(-1)!, { longitud: coordinates.at(-1)![0], latitud: coordinates.at(-1)![1] }) > 10) throw new Error('endpoints');
      let cursor = 0;
      for (const stop of snapped.slice(1, -1)) {
        let found = false;
        for (let i = Math.floor(cursor); i < coordinates.length - 1; i++) {
          const a = coordinates[i]; const b = coordinates[i + 1]; const dx = b[0] - a[0]; const dy = b[1] - a[1]; const length = dx * dx + dy * dy;
          const fraction = Math.max(i === Math.floor(cursor) ? cursor - i : 0, Math.min(1, Math.max(0, length ? ((stop.longitud - a[0]) * dx + (stop.latitud - a[1]) * dy) / length : 0)));
          if (gap(stop, { longitud: a[0] + dx * fraction, latitud: a[1] + dy * fraction }) <= 10) { cursor = i + fraction; found = true; break; }
        }
        if (!found) throw new Error('ordered-waypoint-missing');
      }
      const legs = route.legs.map(raw => { const leg = object(raw); if (!finite(leg.distance) || !finite(leg.duration)) throw new Error('leg'); return { distance_m: leg.distance, duration_s: leg.duration }; });
      if (Math.abs(legs.reduce((s, l) => s + l.distance_m, 0) - route.distance) > Math.max(1, legs.length * 0.2) || Math.abs(legs.reduce((s, l) => s + l.duration_s, 0) - route.duration) > Math.max(1, legs.length * 0.2)) throw new Error('totals');
      return { geometry: { type: 'LineString', coordinates }, distance_m: route.distance, duration_s: route.duration, legs, snapped, provenance: { provider: 'OSRM', profile: this.config.profile, revision: this.config.revision || 'DESCONOCIDA', data_version: typeof data.data_version === 'string' ? data.data_version.slice(0, 100) : null, calculated_at: new Date().toISOString(), parameters: { timeout_ms: this.config.timeoutMs, total_timeout_ms: this.totalTimeoutMs, max_snap_m: this.config.maxSnapM } } };
    } catch (cause) { if (cause instanceof UnprocessableEntityException) throw cause; if (combined.aborted) throw new GatewayTimeoutException('El cálculo de OSRM excedió el tiempo permitido.'); throw new BadGatewayException('El proveedor de recorridos no respondió con un resultado válido.'); }
  }
}
