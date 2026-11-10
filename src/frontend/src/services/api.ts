import type { Credentials, LoginResponse, SessionIdentity } from '../types/auth';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly executionId?: string, public readonly code?: string) { super(message); }
}
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${baseUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store' }); }
  catch { throw new ApiError('No se pudo conectar al servidor. Inténtalo de nuevo.', 0); }
  if (!response.ok) {
    if (/^\/(?:drivers\/[^/]+\/account\/(?:credentials|reset-password)|driver\/account\/password)$/.test(path) && response.status !== 401) {
      const payload = await response.json().catch(() => null) as { message?: unknown } | null;
      const fallback: Record<number, string> = { 400: 'Revisa la contraseña, su confirmación y los datos requeridos.', 403: 'No tienes permiso para cambiar las credenciales de esta cuenta.', 404: 'Conductor o cuenta vinculada no encontrados.', 409: 'La cuenta o sus credenciales cambiaron. Recarga antes de reintentar.', 429: 'Demasiados intentos. Espera un minuto.', 503: 'La gestión de credenciales todavía no está habilitada.' };
      throw new ApiError(typeof payload?.message === 'string' ? payload.message : fallback[response.status] ?? 'No se pudo cambiar la contraseña.', response.status);
    }
    if (/^\/(?:planning|routes)(?:\?|\/|$)/.test(path) && response.status !== 401) {
      const payload = await response.json().catch(() => null) as { message?: unknown; execution_id?: unknown; code?: unknown } | null;
      const fallback: Record<number, string> = { 400: 'Revisa la selección, origen, jornada y confirmaciones.', 403: 'No tienes permisos para planificar o consultar rutas.', 404: 'Ruta, versión o planificación no encontrada.', 409: 'Los datos cambiaron. Recarga y prepara una nueva versión.', 422: 'No existe un recorrido vial conectable.', 429: 'Ya hay un cálculo en curso. Espera antes de reintentar.', 502: 'OSRM devolvió una respuesta inválida.', 503: 'Sistema de rutas o proveedor pendiente de habilitación.', 504: 'Se agotó el tiempo de cálculo.' };
      throw new ApiError(typeof payload?.message === 'string' ? payload.message : fallback[response.status] ?? 'No se pudo completar la operación de rutas.', response.status, typeof payload?.execution_id === 'string' ? payload.execution_id : undefined, typeof payload?.code === 'string' ? payload.code : undefined);
    }
    if (/^\/drivers\/(?:account-options(?:\?|$)|[^/]+\/account$)/.test(path) && response.status !== 401) {
      const payload = await response.json().catch(() => null) as { message?: unknown } | null;
      const fallback: Record<number, string> = { 400: 'Revisa el correo, la contraseña y la cuenta elegida.', 403: 'Solo el Administrador puede gestionar cuentas de acceso.', 404: 'Conductor o cuenta no encontrados.', 409: 'La cuenta o el vínculo cambió. Recarga la ficha antes de reintentar.' };
      throw new ApiError(typeof payload?.message === 'string' ? payload.message : fallback[response.status] ?? 'No se pudo gestionar la cuenta. Inténtalo de nuevo.', response.status);
    }
    if (path === '/driver/me' && response.status !== 401) {
      if (response.status === 403) {
        const allowed = ['Tu cuenta no tiene un conductor vinculado. Contacta al administrador.', 'Tu ficha de conductor está inactiva. Contacta al administrador.', 'Este acceso requiere el rol Usuario Final / Conductor.'];
        const payload = await response.json().catch(() => ({})) as { message?: unknown };
        throw new ApiError(typeof payload.message === 'string' && allowed.includes(payload.message) ? payload.message : 'No tienes permiso para acceder al panel del conductor.', 403);
      }
      throw new ApiError(response.status === 404 ? 'El acceso del conductor todavía no está habilitado en el servidor.' : 'No se pudo consultar tu identidad de conductor. Inténtalo de nuevo.', response.status);
    }
    if (/^\/drivers(?:\?|\/|$)/.test(path)) {
      const messages:Record<number,string>={400:'Revisa los datos obligatorios, la experiencia y la cuenta vinculada; debe tener rol de conductor.',403:'No tienes permisos para gestionar conductores.',404:'Conductor no encontrado.',409:'El DNI o la cuenta ya pertenece a otro conductor.',503:'Gestión de conductores pendiente de habilitación: falta aplicar la migración autorizada.'};
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

    if (/^\/driver\/(?:routes|deliveries)(?:\/|$)/.test(path) && response.status !== 401) {
      const payload = await response.json().catch(() => null) as { message?: unknown } | null;
      const incident = /\/incidents$/.test(path);
      const fallback: Record<number, string> = { 400: incident ? 'Revisa el tipo y la descripción de la incidencia.' : 'Revisa el estado y la causa de la entrega.', 403: 'La entrega no existe o no está asignada a tu cuenta.', 404: 'Ruta o entrega no encontrada.', 409: 'La entrega cambió. Recarga la ruta antes de reintentar.' };
      // US-018: la validación de incidencias devuelve un mensaje por campo («campo: detalle»).
      const fieldMessages = incident && Array.isArray(payload?.message) && payload.message.every(item => typeof item === 'string') ? payload.message as string[] : null;
      throw new ApiError(typeof payload?.message === 'string' ? payload.message : fieldMessages?.length ? fieldMessages.join('\n') : fallback[response.status] ?? 'No se pudo completar la operación de la ruta.', response.status);
    }

    // US-019: seguimiento operativo; conserva los mensajes del backend y uno por filtro inválido.
    if (/^\/operations(?:\?|\/|$)/.test(path) && response.status !== 401) {
      const payload = await response.json().catch(() => null) as { message?: unknown } | null;
      const fallback: Record<number, string> = { 400: 'Revisa los filtros del seguimiento operativo.', 403: 'No tienes permisos para consultar el seguimiento operativo.', 404: 'La ruta no existe o todavía no está en operación.' };
      const messages = Array.isArray(payload?.message) && payload.message.every(item => typeof item === 'string') ? payload.message as string[] : null;
      throw new ApiError(typeof payload?.message === 'string' ? payload.message : messages?.length ? messages.join('\n') : fallback[response.status] ?? 'No se pudo consultar el seguimiento operativo.', response.status);
    }

    const orderRead = /^\/orders(?:\?|\/)/.test(path);
    if (response.status === 401) throw new ApiError('Credenciales incorrectas o usuario no habilitado.', 401);
    if (response.status === 403) throw new ApiError(orderRead ? 'No tienes permisos para consultar pedidos.' : path === '/orders' ? 'No tienes permisos para registrar pedidos.' : 'No tienes permisos para administrar usuarios y roles.', 403);
    if (orderRead && response.status === 400) throw new ApiError('Revisa los criterios de consulta del pedido.', 400);
    if (path === '/orders' && response.status === 400) {
      throw new ApiError('No se pudo registrar el pedido. Revisa los campos obligatorios, coordenadas, peso, volumen y ventana de entrega.', 400);
    }
    if (path === '/orders' && response.status === 503) throw new ApiError('La cobertura geográfica no está disponible o no pudo verificarse. No se puede registrar el pedido.', 503);
    if (response.status === 409 && /^\/users(?:[/?]|$)/.test(path)) throw new ApiError('Ya existe un usuario con ese correo electrónico.', 409);
    if (response.status === 404) {
      if (orderRead) throw new ApiError('Pedido no encontrado.', 404);
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

