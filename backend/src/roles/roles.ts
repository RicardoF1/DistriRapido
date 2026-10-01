export const ROLE_NAMES = {
  administrator: 'Administrador',
  operator: 'Operador / Técnico',
  driver: 'Usuario Final / Conductor',
  auditor: 'Auditor Externo',
} as const;

export function isAllowedRole(name: string): boolean {
  return Object.values(ROLE_NAMES).some((role) => role === name);
}
