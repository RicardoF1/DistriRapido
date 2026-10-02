import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../services/orders-api';
import { ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { ORDER_PRIORITIES, ORDER_STATES, PRODUCT_TYPES, type OrderPage, type OrderQuery } from '../types/orders';
import { formatOrderDate, orderLabel } from '../features/orders/order-display';
const initial: OrderQuery = { search: '', estado: '', prioridad: '', tipo_producto: '', page: 1, pageSize: 20 };
export function OrdersPage() {
  const [query, setQuery] = useState(initial); const [search, setSearch] = useState('');
  const [result, setResult] = useState<OrderPage | null>(null); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
  const { acceptSession } = useAuth();
  useEffect(() => {
    const timer = setTimeout(() => setQuery(current => current.search === search.trim() ? current : { ...current, search: search.trim(), page: 1 }), 500);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    ordersApi.list(query, controller.signal).then(data => { if (!controller.signal.aborted) setResult(data); }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) acceptSession(null);
      else setError(cause instanceof ApiError && cause.status === 403 ? 'No tienes permisos para consultar pedidos.' : 'No se pudieron consultar los pedidos. Inténtalo de nuevo.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, attempt, acceptSession]);
  const filtered = Boolean(query.search || query.estado || query.prioridad || query.tipo_producto);
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / query.pageSize));
  return <section className="users-panel"><div className="page-heading"><h1>Consultar pedidos</h1><Link className="button button-primary" to="/pedidos/nuevo">Registrar pedido</Link></div>
    <div className="order-query"><div className="form-field"><label htmlFor="order-search">Buscar cliente, dirección o ID</label><input id="order-search" value={search} maxLength={255} type="search" onChange={event => setSearch(event.target.value)} /></div>
      {([['estado', 'Estado', ORDER_STATES], ['prioridad', 'Prioridad', ORDER_PRIORITIES], ['tipo_producto', 'Tipo de producto', PRODUCT_TYPES]] as const).map(([field, label, options]) => <div className="form-field" key={field}><label htmlFor={`filter-${field}`}>{label}</label><select id={`filter-${field}`} value={query[field]} onChange={event => setQuery(current => ({ ...current, [field]: event.target.value, search: search.trim(), page: 1 }))}><option value="">Todos</option>{options.map(option => <option key={option} value={option}>{orderLabel(option)}</option>)}</select></div>)}
      <button className="button button-secondary" type="button" onClick={() => { setSearch(''); setQuery(initial); }}>Limpiar filtros</button>
    </div>
    <p>Ventanas de entrega en America/Lima (UTC−05:00).</p>
    {loading ? <p role="status">Cargando pedidos…</p> : error ? <><ErrorMessage message={error} /><button className="button button-secondary" onClick={() => setAttempt(current => current + 1)}>Reintentar</button></> : result && <>
      {!result.items.length ? <p role="status">{filtered ? 'No se encontraron pedidos con los criterios seleccionados.' : result.total ? 'No hay pedidos en esta página.' : 'No hay pedidos registrados.'}</p> : <>
        <p className="table-hint">Desliza la tabla para consultar todos los datos del pedido.</p>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Listado de pedidos"><table><caption className="sr-only">Pedidos registrados</caption><thead><tr>{['ID', 'Cliente', 'Dirección', 'Ventana de entrega', 'Prioridad', 'Tipo', 'Peso', 'Volumen', 'Estado', 'Detalle'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{result.items.map(order => <tr key={order.pedido_id}><td>{order.pedido_id}</td><td>{order.cliente.nombre}</td><td>{order.cliente.direccion}</td><td>{formatOrderDate(order.ventana_inicio)} → {formatOrderDate(order.ventana_fin)}</td><td>{orderLabel(order.prioridad)}</td><td>{orderLabel(order.tipo_producto)}</td><td>{order.peso_kg} kg</td><td>{order.volumen_m3 === null ? 'No informado' : `${order.volumen_m3} m³`}</td><td>{orderLabel(order.estado)}</td><td><Link className="table-action" aria-label={`Ver detalle de ${order.pedido_id}`} to={`/pedidos/${order.pedido_id}`}>Ver detalle</Link></td></tr>)}</tbody></table></div>
      </>}
      <nav className="order-pagination" aria-label="Paginación de pedidos"><button className="button button-secondary" disabled={query.page <= 1} onClick={() => setQuery(current => ({ ...current, page: current.page - 1 }))}>Anterior</button><span>Página {query.page} de {pages} · {result.total} pedidos</span><button className="button button-secondary" disabled={query.page >= pages} onClick={() => setQuery(current => ({ ...current, page: current.page + 1 }))}>Siguiente</button></nav>
    </>}
  </section>;
}
