// Paginación accesible reutilizable para listados (Green IT, área 2).
interface PaginationProps { label: string; page: number; pageSize: number; total: number; onPage: (page: number) => void }

export function Pagination({ label, page, pageSize, total, onPage }: Readonly<PaginationProps>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return <nav className="order-pagination" aria-label={label}>
    <button type="button" className="button button-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
    <span>Página {page} de {pages} · {total} registros</span>
    <button type="button" className="button button-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente</button>
  </nav>;
}
