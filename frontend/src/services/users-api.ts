import { request } from './api';
import type { RoleOption, UserAccount, UserValues } from '../types/users';
export const usersApi = {
  list: (signal?: AbortSignal) => request<UserAccount[]>('/users', { signal }),
  get: (id: string, signal?: AbortSignal) => request<UserAccount>(`/users/${encodeURIComponent(id)}`, { signal }),
  roles: (signal?: AbortSignal) => request<RoleOption[]>('/roles', { signal }),
  create: (values: UserValues) => request<UserAccount>('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
  update: (id: string, values: UserValues) => request<UserAccount>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: values.email, rol_id: values.rol_id, estado: values.estado }) }),
};
