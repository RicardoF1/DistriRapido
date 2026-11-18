import type { RouteDetail, RouteState, SustainabilityInput, SustainabilitySource } from '../../types/routes';

type Version = RouteDetail['versiones'][number];
export type NumericField = 'distancia_km' | 'combustible_l' | 'factor_emision_kg_co2_km' | 'costo_combustible';
export type SustainabilityField = NumericField | 'origen_datos';
export interface SustainabilityForm { distancia_km: string; combustible_l: string; factor_emision_kg_co2_km: string; origen_datos: '' | SustainabilitySource; costo_combustible: string; observaciones: string }
export interface SustainabilityCheck { input?: SustainabilityInput; missing: SustainabilityField[]; invalid: Partial<Record<SustainabilityField, string>> }

/** US-021: información obligatoria, en el mismo orden y con los mismos nombres que usa el backend. */
export const REQUIRED_SUSTAINABILITY_FIELDS: SustainabilityField[] = ['distancia_km', 'combustible_l', 'factor_emision_kg_co2_km', 'origen_datos'];
export const SUSTAINABILITY_LABELS: Record<SustainabilityField, string> = {
  distancia_km: 'Distancia recorrida (km)',
  combustible_l: 'Combustible consumido (L)',
  factor_emision_kg_co2_km: 'Factor de emisión (kg CO₂/km)',
  origen_datos: 'Origen de los datos',
  costo_combustible: 'Costo de combustible (S/)',
};
export const SOURCE_LABELS: Record<SustainabilitySource, string> = { ESTIMADO: 'Estimado a partir del cálculo', MEDIDO: 'Medido en la operación' };

const RULES: Record<NumericField, { decimals: number; min: number; positive?: boolean; max: number; message: string }> = {
  distancia_km: { decimals: 3, min: 0, positive: true, max: 10000, message: 'Indica un número mayor que 0 y hasta 10 000, con hasta 3 decimales.' },
  combustible_l: { decimals: 3, min: 0, max: 100000, message: 'Indica un número entre 0 y 100 000, con hasta 3 decimales.' },
  factor_emision_kg_co2_km: { decimals: 5, min: 0, max: 100, message: 'Indica un número entre 0 y 100, con hasta 5 decimales.' },
  costo_combustible: { decimals: 2, min: 0, max: 1000000, message: 'Indica un número entre 0 y 1 000 000, con hasta 2 decimales.' },
};

const rounded = (value: number, decimals: number) => String(Number(value.toFixed(decimals)));

/** Precarga con la distancia calculada y los datos del vehículo; el origen se elige siempre de forma explícita. */
export function initialSustainabilityForm(version: Version): SustainabilityForm {
  const km = Number(version.distancia_m) / 1000;
  const kmPerLiter = Number(version.vehiculo?.consumo_km_l);
  const factor = Number(version.vehiculo?.factor_emision_kg_co2_km);
  return {
    distancia_km: km > 0 ? rounded(km, 3) : '',
    combustible_l: km > 0 && kmPerLiter > 0 ? rounded(km / kmPerLiter, 3) : '',
    factor_emision_kg_co2_km: Number.isFinite(factor) && factor >= 0 ? rounded(factor, 5) : '',
    origen_datos: '',
    costo_combustible: '',
    observaciones: '',
  };
}

function parse(field: NumericField, raw: string): number | undefined {
  const rule = RULES[field];
  if (!new RegExp(String.raw`^\d+(\.\d{1,${rule.decimals}})?$`).test(raw)) return undefined;
  const value = Number(raw);
  return value < rule.min || value > rule.max || (rule.positive && value === 0) ? undefined : value;
}

/** Un dato medido solo existe cuando la operación terminó; antes solo hay estimaciones (misma regla que el backend). */
export const MEASURED_REQUIRES_COMPLETED = 'Los datos medidos solo se pueden registrar cuando la ruta está completada. Registra datos estimados o espera a que la ruta termine.';

/** Comprueba el formulario como lo hará el backend: lista la información faltante y la inválida. */
export function checkSustainability(form: SustainabilityForm, routeState: RouteState): SustainabilityCheck {
  const missing = REQUIRED_SUSTAINABILITY_FIELDS.filter(field => form[field].trim() === '');
  const invalid: SustainabilityCheck['invalid'] = {};
  if (form.origen_datos === 'MEDIDO' && routeState !== 'COMPLETADA') invalid.origen_datos = MEASURED_REQUIRES_COMPLETED;
  const values: Partial<Record<NumericField, number>> = {};
  for (const field of Object.keys(RULES) as NumericField[]) {
    const raw = form[field].trim();
    if (!raw) continue;
    const value = parse(field, raw);
    if (value === undefined) invalid[field] = RULES[field].message;
    else values[field] = value;
  }
  if (missing.length || Object.keys(invalid).length) return { missing, invalid };
  const observations = form.observaciones.trim();
  return {
    missing, invalid,
    input: {
      distancia_km: values.distancia_km!,
      combustible_l: values.combustible_l!,
      factor_emision_kg_co2_km: values.factor_emision_kg_co2_km!,
      origen_datos: form.origen_datos as SustainabilitySource,
      ...(values.costo_combustible === undefined ? {} : { costo_combustible: values.costo_combustible }),
      ...(observations ? { observaciones: observations } : {}),
    },
  };
}

/** Mensaje único para el usuario: primero lo que falta y después lo que hay que corregir. */
export function sustainabilityProblem(check: SustainabilityCheck): string {
  const missing = check.missing.map(field => SUSTAINABILITY_LABELS[field].toLowerCase());
  const invalid = (Object.keys(check.invalid) as SustainabilityField[]).map(field => SUSTAINABILITY_LABELS[field].toLowerCase());
  return [
    ...(missing.length ? [`Falta información requerida: ${missing.join(', ')}.`] : []),
    ...(invalid.length ? [`Revisa: ${invalid.join(', ')}.`] : []),
  ].join(' ');
}

/** Vista previa de las emisiones: el backend las recalcula con precisión decimal (RN-009). */
export function emissionsPreview(form: SustainabilityForm): string | undefined {
  const km = parse('distancia_km', form.distancia_km.trim());
  const factor = parse('factor_emision_kg_co2_km', form.factor_emision_kg_co2_km.trim());
  return km === undefined || factor === undefined ? undefined : rounded(km * factor, 4);
}

export const decimal = (value: string, unit: string) => `${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 5 })} ${unit}`;
