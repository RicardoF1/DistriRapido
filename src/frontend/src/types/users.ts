import type { AuthUser } from './auth';
export const USER_STATES = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] as const;
export type UserState = typeof USER_STATES[number];
export interface UserAccount extends AuthUser { rol_id: string; estado: UserState; creado_en: string }
export interface RoleOption { rol_id: string; nombre: string; descripcion: string }
export interface UserValues { email: string; rol_id: string; estado: UserState; password?: string }
