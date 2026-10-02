import { request } from './api';
import type { OrderValues, RegisteredOrder, OrderQuery, OrderPage, OrderRead } from '../types/orders';
export const ordersApi = {
  list: (query: OrderQuery, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== '') params.set(key, String(value));
    return request<OrderPage>(`/orders?${params}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<OrderRead>(`/orders/${encodeURIComponent(id)}`, { signal }),
  create: (values: OrderValues) => request<RegisteredOrder>('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
};
