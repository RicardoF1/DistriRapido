import { QueryClient } from '@tanstack/react-query';

// Green IT (área 7): caché en memoria del cliente para catálogos que cambian poco (roles y vehículos).
// Evita repetir la misma petición al navegar; los datos personales u operativos no pasan por aquí.
export const CATALOG_STALE_TIME = 5 * 60_000;
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: CATALOG_STALE_TIME } },
});
export const catalogKeys = {
  roles: ['catalog', 'roles'] as const,
  vehicles: (page: number) => ['catalog', 'vehicles', page] as const,
  allVehicles: ['catalog', 'vehicles'] as const,
};
