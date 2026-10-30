import { request } from './api';
export interface CredentialAccount { usuario_id: string; email: string; estado: string; credentials_version: number }
export interface NewPassword { password: string; password_confirmation: string }
export const driverCredentialsApi = {
  metadata: (id: string, signal?: AbortSignal) => request<CredentialAccount>(`/drivers/${id}/account/credentials`, { signal }),
  reset: (id: string, dto: NewPassword & { expected_usuario_id: string; expected_credentials_version: number; confirmed: boolean }) => request<{ message: string }>(`/drivers/${id}/account/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }),
  own: (dto: NewPassword & { current_password: string }) => request<{ message: string }>('/driver/account/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }),
};
