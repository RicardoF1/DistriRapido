export interface AuthUser {
  usuario_id: string;
  email: string;
  rol: { rol_id: string; nombre: string };
}
export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}
export interface Credentials { email: string; password: string }
export interface SessionIdentity extends AuthUser { expiresAt: number }
export interface AuthSession { user: AuthUser; expiresAt: number }
