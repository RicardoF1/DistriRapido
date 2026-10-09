import { request } from './api';
export interface AdminSummary {
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  ordersByState: { state: string; count: number }[];
}
export const adminApi = {
  async summary(signal?: AbortSignal): Promise<AdminSummary> {
    const data = await request<AdminSummary>('/admin/summary', { signal });
    const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
    if (!data || !count(data.totalOrders) || !count(data.pendingOrders) || !count(data.totalUsers) || !Array.isArray(data.ordersByState)
      || data.ordersByState.some(group => !group || typeof group.state !== 'string' || !group.state.trim() || !count(group.count))
      || new Set(data.ordersByState.map(group => group.state)).size !== data.ordersByState.length
      || data.ordersByState.reduce((total, group) => total + group.count, 0) !== data.totalOrders
      || (data.ordersByState.find(group => group.state === 'PENDIENTE')?.count ?? 0) !== data.pendingOrders) {
      throw new Error('El resumen recibido no es válido.');
    }
    return data;
  },
};
