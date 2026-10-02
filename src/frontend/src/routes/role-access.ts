const destinations: Record<string, string> = {
  'Administrador': 'administrador',
  'Operador / Técnico': 'operador',
  'Usuario Final / Conductor': 'conductor',
  'Auditor Externo': 'auditor',
};
export function accessPath(role: string) { return `/acceso/${destinations[role] ?? 'sin-permiso'}`; }
