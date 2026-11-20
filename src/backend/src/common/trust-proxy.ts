/**
 * Valor de `trust proxy` de Express a partir de TRUST_PROXY. Detrás de los proxys de Render y de nginx,
 * sin esta opción todas las peticiones comparten la IP del proxy y el límite de ThrottlerGuard se aplicaría
 * a todos los usuarios a la vez. Acepta un número de saltos (recomendado), una lista de IP/CIDR o "true".
 * Vacío o "false": no se confía en X-Forwarded-For (comportamiento local).
 */
export function trustProxySetting(value: string | undefined): boolean | number | string | undefined {
  const raw = value?.trim();
  if (!raw || raw === 'false') return undefined;
  if (raw === 'true') return true;
  if (/^\d+$/.test(raw)) {
    const hops = Number(raw);
    if (hops < 1 || hops > 10) throw new Error('TRUST_PROXY debe estar entre 1 y 10 saltos.');
    return hops;
  }
  if (/^[0-9a-fA-F.:/,\s]+$/.test(raw)) return raw;
  throw new Error('TRUST_PROXY debe ser un número de saltos, una lista de IP/CIDR, "true" o "false".');
}
