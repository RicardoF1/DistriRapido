import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersApi } from '../services/orders-api';
import { ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { OrderRead } from '../types/orders';
import { formatOrderDate, orderLabel } from '../features/orders/order-display';
export function OrderDetailPage() {
  const { id = '' } = useParams(); const { acceptSession } = useAuth();
  const [order, setOrder] = useState<OrderRead | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    ordersApi.get(id, controller.signal).then(data => { if (!controller.signal.aborted) setOrder(data); }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) acceptSession(null);
      else setError(cause instanceof ApiError && cause.status === 404 ? 'Pedido no encontrado.' : cause instanceof ApiError && cause.status === 403 ? 'No tienes permisos para consultar pedidos.' : 'No se pudo consultar el pedido. Inténtalo de nuevo.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt, acceptSession]);
  const section = (title: string, entries: [string, string][]) => <section className="order-detail-section"><h2>{title}</h2><dl>{entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>;
  return <section className="users-panel"><div className="page-heading"><h1>Detalle del pedido</h1><Link className="button button-secondary" to="/pedidos">Volver a pedidos</Link></div>
    {loading ? <p role="status">Cargando detalle…</p> : error ? <><ErrorMessage message={error} /><button className="button button-secondary" onClick={() => setAttempt(current => current + 1)}>Reintentar</button></> : order && <div className="order-detail-grid">
      {section('Pedido', [['ID', order.pedido_id], ['Estado', orderLabel(order.estado)], ['Creado en', formatOrderDate(order.creado_en)]])}
      {section('Cliente', [['Nombre', order.cliente.nombre], ['Teléfono', order.cliente.telefono || 'No informado'], ['Correo', order.cliente.email || 'No informado']])}
      {section('Ubicación de entrega', [['Dirección', order.cliente.direccion], ['Referencia', order.cliente.referencia || 'No informada']])}
      {section('Carga', [['Descripción', order.descripcion_carga || 'No informada'], ['Peso', `${order.peso_kg} kg`], ['Volumen', order.volumen_m3 === null ? 'No informado' : `${order.volumen_m3} m³`], ['Tipo de producto', orderLabel(order.tipo_producto)]])}
      {section('Entrega', [['Inicio de ventana', formatOrderDate(order.ventana_inicio)], ['Fin de ventana', formatOrderDate(order.ventana_fin)], ['Prioridad', orderLabel(order.prioridad)], ['Zona horaria', 'America/Lima (UTC−05:00)']])}
    </div>}
  </section>;
}
