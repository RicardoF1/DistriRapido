import { request } from './api';
import type {
  AvailabilityPage,
  AvailabilityRecord,
  AvailabilityValues,
} from '../types/availability';

export const availabilityApi = {
  list: (
    page = 1,
    estado = '',
    inicio = '',
    fin = '',
    signal?: AbortSignal,
  ) =>
    request<AvailabilityPage>(
      '/availability?' +
        new URLSearchParams({
          page: String(page),
          pageSize: '20',
          ...(estado ? { estado } : {}),
          ...(inicio ? { inicio } : {}),
          ...(fin ? { fin } : {}),
        }),
      { signal },
    ),

  get: (id: string, signal?: AbortSignal) =>
    request<AvailabilityRecord>(
      `/availability/${id}`,
      { signal },
    ),

  create: (values: AvailabilityValues) =>
    request<AvailabilityRecord>('/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    }),

  update: (
    id: string,
    values: Partial<AvailabilityValues>,
  ) =>
    request<AvailabilityRecord>(
      `/availability/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      },
    ),
};
