import { Prisma } from '@prisma/client';
export const DRIVER_FIELDS = { conductor_id: true, nombre_completo: true, dni: true, licencia_categoria: true, telefono: true, anios_experiencia: true, estado: true, usuario_id: true } as const;
export const ACCOUNT_FIELDS = { usuario_id: true, email: true, estado: true } as const;
type Row = Prisma.ConductorGetPayload<{ select: typeof DRIVER_FIELDS }> & { usuario?: { usuario_id: string; email: string; estado: string } | null };
export function driverSelection(administrator: boolean) { return { ...DRIVER_FIELDS, ...(administrator ? { usuario: { select: ACCOUNT_FIELDS } } : {}) }; }
export function driverView(row: Row, administrator: boolean) {
  const { usuario_id, usuario, ...data } = row;
  return { ...data, cuenta_vinculada: Boolean(usuario_id), ...(administrator ? { cuenta: usuario ? { usuario_id: usuario.usuario_id, email: usuario.email, estado: usuario.estado } : null } : {}) };
}
