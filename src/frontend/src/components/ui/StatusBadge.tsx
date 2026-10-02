import type { UserState } from '../../types/users';
const labels: Record<UserState, string> = { ACTIVO: 'Activo', INACTIVO: 'Inactivo', BLOQUEADO: 'Bloqueado' };
export function StatusBadge({ state }: { state: UserState }) { return <span className={`status-badge status-${state.toLowerCase()}`}>{labels[state]}</span>; }
