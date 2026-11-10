// Green IT (área 2): tamaño de página común a los listados, alineado con DEFAULT_PAGE_SIZE del backend.
export const PAGE_SIZE = 12;
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }
export const pageQuery = (page: number) => new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) }).toString();
