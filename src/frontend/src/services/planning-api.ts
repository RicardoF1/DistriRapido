import { request } from './api';
import type { Calculation, PlanningCandidates, PlanningInput, PreparedPlan } from '../types/planning';
export const planningApi = {
  candidates: (inicio: string, fin: string, page = 1) => request<PlanningCandidates>('/planning/candidates?' + new URLSearchParams({ inicio, fin, page: String(page), pageSize: '20' }), {}),
  prepare: (input: PlanningInput) => request<PreparedPlan>('/planning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
  update: (id: string, version: number, input: PlanningInput) => request<PreparedPlan>('/planning/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, expected_version: version }) }),
  calculate: (id: string, version: number, key: string) => request<Calculation>(`/planning/${id}/calculations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify({ expected_version: version, confirm_origin: true, confirm_order: true, confirm_return: true }) }),
  alternatives: (id: string, version: number, key: string) => request<Calculation>(`/planning/${id}/alternatives`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify({ expected_version: version, confirm_origin: true, confirm_order: true, confirm_return: true }) }),
  execution: (id: string, executionId: string) => request<Calculation>(`/planning/${id}/calculations/${executionId}`, {}),
};
