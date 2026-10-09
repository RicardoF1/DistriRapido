import type { Credentials, LoginResponse, SessionIdentity } from '../types/auth';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${baseUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store' }); }
  catch { throw new ApiError('No se pudo conectar al servidor. IntÃ©ntalo de nuevo.', 0); }
  if (!response.ok) {
    if (/^\/drivers(?:\?|\/|$)/.test(path)) {
      const messages:Record<number,string>={400:'Revisa los datos obligatorios, la experiencia y la cuenta vinculada; debe tener rol de conductor.',403:'No tienes permisos para gestionar conductores.',404:'Conductor no encontrado.',409:'El DNI o la cuenta ya pertenece a otro conductor.',503:'GestiÃ³n de conductores pendiente de habilitaciÃ³n: falta aplicar la migraciÃ³n autorizada.'};
      if(messages[response.status])throw new ApiError(messages[response.status],response.status);
    }
    if (/^\/availability(?:\?|\/|$)/.test(path)) {
      let backendMessage = '';

      try {
        const payload = await response.clone().json() as {
          message?: unknown;
        };

        if (typeof payload.message === 'string') {
          backendMessage = payload.message;
        }
      } catch {
        backendMessage = '';
      }

      const fallbackMessages: Record<number, string> = {
        400: 'Revisa el conductor, el estado y el intervalo de disponibilidad.',
        403: 'No tienes permisos para gestionar la disponibilidad operativa.',
        404: 'Registro de disponibilidad o conductor no encontrado.',
        409: 'La disponibilidad indicada presenta un conflicto con otro intervalo.',
        503: 'La disponibilidad operativa no está habilitada. Verifica la migración de US-009.',
      };

      throw new ApiError(
        backendMessage ||
          fallbackMessages[response.status] ||
          'No se pudo completar la operación de disponibilidad.',
        response.status,
      );
    }

    const orderRead = /^\/orders(?:\?|\/)/.test(path);
    if (response.status === 401) throw new ApiError('Credenciales incorrectas o usuario no habilitado.', 401);
    if (response.status === 403) throw new ApiError(orderRead ? 'No tienes permisos para consultar pedidos.' : path === '/orders' ? 'No tienes permisos para registrar pedidos.' : 'No tienes permisos para administrar usuarios y roles.', 403);
    if (orderRead && response.status === 400) throw new ApiError('Revisa los criterios de consulta del pedido.', 400);
    if (path === '/orders' && response.status === 400) {
      throw new ApiError('No se pudo registrar el pedido. Revisa los campos obligatorios, coordenadas, peso, volumen y ventana de entrega.', 400);
    }
    if (path === '/orders' && response.status === 503) throw new ApiError('La cobertura geogrÃ¡fica no estÃ¡ disponible o no pudo verificarse. No se puede registrar el pedido.', 503);
    if (response.status === 409) throw new ApiError('Ya existe un usuario con ese correo electrÃ³nico.', 409);
    if (response.status === 404) {
      if (orderRead) throw new ApiError('Pedido no encontrado.', 404);
      const userDetail = /^\/users\/[^/]+$/.test(path);
      throw new ApiError(userDetail ? 'Usuario no encontrado.' : `La ruta ${path} no estÃ¡ disponible en el servidor. Comprueba que el backend estÃ© actualizado.`, 404);
    }
    if (response.status === 429) throw new ApiError('Demasiados intentos. Espera un minuto antes de volver a intentarlo.', 429);
    throw new ApiError('No se pudo completar la solicitud. IntÃ©ntalo de nuevo.', response.status);
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

