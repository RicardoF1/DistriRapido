import type { Credentials, LoginResponse, SessionIdentity } from '../types/auth';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${baseUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store' }); }
  catch { throw new ApiError('No se pudo conectar al servidor. Inténtalo de nuevo.', 0); }
  if (!response.ok) {
    if (response.status === 401) throw new ApiError('Credenciales incorrectas o usuario no habilitado.', 401);
    if (response.status === 403) throw new ApiError(path === '/orders' ? 'No tienes permisos para registrar pedidos.' : 'No tienes permisos para administrar usuarios y roles.', 403);
    if (path === '/orders' && response.status === 400) {
      throw new ApiError('No se pudo registrar el pedido. Revisa los campos obligatorios, coordenadas, peso, volumen y ventana de entrega.', 400);
    }
    if (response.status === 409) throw new ApiError('Ya existe un usuario con ese correo electrónico.', 409);
    if (response.status === 404) {
      const userDetail = /^\/users\/[^/]+$/.test(path);
      throw new ApiError(userDetail ? 'Usuario no encontrado.' : `La ruta ${path} no está disponible en el servidor. Comprueba que el backend esté actualizado.`, 404);
    }
    if (response.status === 429) throw new ApiError('Demasiados intentos. Espera un minuto antes de volver a intentarlo.', 429);
    throw new ApiError('No se pudo completar la solicitud. Inténtalo de nuevo.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const authApi = {
  login(credentials: Credentials) {
    return request<LoginResponse>('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
  },
  me(signal?: AbortSignal) {
    return request<SessionIdentity>('/auth/me', { signal });
  },
  logout() { return request<void>('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); },
};
