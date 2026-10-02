import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { ordersApi } from '../services/orders-api';
import { OrderForm } from '../features/orders/OrderForm';
import type { OrderValues } from '../types/orders';
export function OrderRegistrationPage() {
  const { acceptSession } = useAuth();
  async function save(values: OrderValues) {
    try { return await ordersApi.create(values); }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) acceptSession(null); throw cause; }
  }
  return <section className="users-panel user-editor"><h1>Registrar pedido</h1><p>Completa el cliente, selecciona el destino en el mapa e indica el peso y la entrega. Referencia, descripción y volumen son opcionales.</p><OrderForm onSave={save} /></section>;
}
