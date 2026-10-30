import { request } from './api';
import type { RouteDetail, RoutePage } from '../types/routes';
export const routesApi = { list: (page = 1, search = '', signal?: AbortSignal) => request<RoutePage>('/routes?' + new URLSearchParams({ page: String(page), pageSize: '20', search }), { signal }), get: (id: string, version?: number, signal?: AbortSignal) => request<RouteDetail>(`/routes/${id}${version ? '/versions/' + version : ''}`, { signal }) };
