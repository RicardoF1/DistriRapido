import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { districtAt, normalizePoint, validateCoverage, type Coverage, type DeliveryPoint } from './generated/coverage';
import { coverageRelease } from './generated/release';
export const COVERAGE_UNAVAILABLE = 'La cobertura geográfica no está disponible o no pudo verificarse. No se puede registrar el pedido.';
export const OUTSIDE_COVERAGE = 'Ubicación fuera de cobertura: selecciona Huancayo, El Tambo, Chilca, Pilcomayo o Huancán.';
export function readCoverage(directory: string): Coverage {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8')) as { version: string; enabled: Record<string, string>; files_sha256: Record<string, string> };
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  if (manifest.version !== coverageRelease.version || !same(manifest.enabled, coverageRelease.enabled) || !same(manifest.files_sha256, coverageRelease.files_sha256)) throw new Error('Manifiesto no aprobado.');
  let combined = '';
  for (const [name, hash] of Object.entries(coverageRelease.files_sha256)) {
    const bytes = readFileSync(resolve(directory, name));
    if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error('Integridad geográfica inválida.');
    if (name === 'coverage.geojson') combined = bytes.toString('utf8');
  }
  return validateCoverage(JSON.parse(combined), coverageRelease.enabled);
}
@Injectable()
export class CoverageService {
  private coverage: Coverage | null = null;
  onModuleInit() { this.load(); }
  load(directory = resolve(__dirname, '../../../../geodata/coverage/v1')) {
    this.coverage = null;
    try { this.coverage = readCoverage(directory); }
    catch { Logger.warn(COVERAGE_UNAVAILABLE, 'CoverageService'); }
  }
  assertDelivery(point: DeliveryPoint): DeliveryPoint {
    if (!this.coverage) throw new ServiceUnavailableException(COVERAGE_UNAVAILABLE);
    const normalized = normalizePoint(point);
    if (!normalized || point.latitud !== normalized.latitud || point.longitud !== normalized.longitud) throw new BadRequestException('Coordenadas inválidas: utiliza números finitos, rangos válidos y hasta seis decimales.');
    if (!districtAt(this.coverage, normalized)) throw new BadRequestException(OUTSIDE_COVERAGE);
    return normalized;
  }
}
