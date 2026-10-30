import type { RoutingConfig } from './osrm.adapter';
import { isIP } from 'node:net';
const defaults: RoutingConfig = { baseUrl: '', profile: 'driving', revision: '', timeoutMs: 10000, maxSnapM: 100, totalTimeoutMs: 20000 };
export function readRoutingConfig(env: Record<string, string | undefined>): RoutingConfig {
  if (!env.OSRM_BASE_URL?.trim()) return { ...defaults };
  try {
    const url = new URL(env.OSRM_BASE_URL); const allowed = new URL(env.OSRM_ALLOWED_ORIGIN ?? '');
    const local = /^(localhost|127\.0\.0\.1|osrm|host\.docker\.internal)$/.test(url.hostname) || isIP(url.hostname) === 4 && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || allowed.origin !== url.origin || allowed.toString() !== allowed.origin + '/' || !local && url.protocol !== 'https:' || ['router.project-osrm.org', 'routing.openstreetmap.de'].includes(url.hostname)) throw new Error();
    const totalTimeoutMs = Number(env.OSRM_TOTAL_TIMEOUT_MS ?? 20000); const timeoutMs = Number(env.OSRM_TIMEOUT_MS ?? 10000); const maxSnapM = Number(env.OSRM_MAX_SNAP_M ?? 100);
    if (!Number.isSafeInteger(totalTimeoutMs) || totalTimeoutMs < 1000 || totalTimeoutMs > 120000 || !Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > Math.min(30000, totalTimeoutMs) || !Number.isFinite(maxSnapM) || maxSnapM < 1 || maxSnapM > 500 || !/^[a-zA-Z0-9_-]+$/.test(env.OSRM_PROFILE ?? 'driving')) throw new Error();
    return { baseUrl: url.toString().replace(/\/$/, ''), allowedOrigin: allowed.origin, profile: env.OSRM_PROFILE ?? 'driving', revision: (env.OSRM_DATA_REVISION ?? '').slice(0, 200), timeoutMs, maxSnapM, totalTimeoutMs };
  } catch { return { ...defaults, unavailableReason: 'Configuración OSRM inválida o servidor no autorizado. Revisa origen permitido, TLS y límites.' }; }
}
