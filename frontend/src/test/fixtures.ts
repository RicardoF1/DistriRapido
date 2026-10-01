import type { LoginResponse } from '../types/auth';
export const loginResponse: LoginResponse = {
  accessToken: 'test-token-only', tokenType: 'Bearer', expiresIn: 900,
  user: { usuario_id: 'test-user', email: 'test@example.com', rol: { rol_id: 'test-role', nombre: 'Administrador' } },
};
