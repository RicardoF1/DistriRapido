import { request } from './api';
import type { OrderValues, RegisteredOrder } from '../types/orders';
export const ordersApi = {
  create: (values: OrderValues) => request<RegisteredOrder>('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
};
