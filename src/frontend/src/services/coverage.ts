import releaseRaw from '../../../../geodata/coverage-release.json?raw';
const coverageUrl = `${import.meta.env.BASE_URL}geodata/coverage/v1/coverage.geojson`;
import { validateCoverage, type Coverage } from '../../../../geodata/coverage';
export { districtAt, normalizePoint, coverageBounds } from '../../../../geodata/coverage';
export type { Coverage, DeliveryPoint } from '../../../../geodata/coverage';
export const coverageManifest = JSON.parse(releaseRaw) as { version: string; enabled: Record<string, string>; files_sha256: Record<string, string> };
export const COVERAGE_ERROR = 'No se pudo cargar o verificar la cobertura. No puedes confirmar el destino. Recarga la página e inténtalo de nuevo.';
export const OUTSIDE_COVERAGE = 'Ubicación fuera de cobertura. Selecciona un destino en Huancayo, El Tambo, Chilca, Pilcomayo o Huancán.';
export async function decodeCoverage(raw: string): Promise<Coverage> {
  const release = JSON.parse(releaseRaw) as typeof coverageManifest;
  if (coverageManifest.version !== release.version || JSON.stringify(coverageManifest.enabled) !== JSON.stringify(release.enabled) || JSON.stringify(coverageManifest.files_sha256) !== JSON.stringify(release.files_sha256)) throw new Error('Versión no compatible');
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hash = Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== coverageManifest.files_sha256['coverage.geojson']) throw new Error('Integridad de cobertura incorrecta');
  return validateCoverage(JSON.parse(raw), coverageManifest.enabled);
}
let pending: Promise<Coverage> | undefined;
export function loadCoverage(): Promise<Coverage> {
  pending ??= fetch(coverageUrl, { credentials: 'omit', signal: AbortSignal.timeout(10000) }).then(async response => {
    if (!response.ok) throw new Error('Cobertura no disponible');
    return decodeCoverage(await response.text());
  });
  return pending;
}
