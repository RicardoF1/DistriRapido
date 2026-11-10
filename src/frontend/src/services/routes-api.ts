import { request } from './api';
import type { AssignmentCandidate, RouteAssignment, RouteDetail, RoutePage } from '../types/routes';
import { PAGE_SIZE } from './pagination';
export const routesApi = { list: (page = 1, search = '', signal?: AbortSignal) => request<RoutePage>('/routes?' + new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), search }), { signal }), get: (id: string, version?: number, signal?: AbortSignal) => request<RouteDetail>(`/routes/${id}${version ? '/versions/' + version : ''}`, { signal }),
  candidates: (id: string, signal?: AbortSignal) => request<AssignmentCandidate[]>(`/routes/${encodeURIComponent(id)}/assignment-candidates`, { signal }),
  assign: (id: string, conductorId: string) => request<RouteAssignment>(`/routes/${encodeURIComponent(id)}/assignment`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conductor_id: conductorId, expected_estado: 'GENERADA', confirmed: true }) }),
};
