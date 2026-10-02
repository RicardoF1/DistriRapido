import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { accessPath } from './role-access';
import { SessionCheck } from '../components/SessionCheck';
export function ProtectedRoute() {
  const { session, restoring, restoreError } = useAuth();
  const location = useLocation();
  // Revalidating an existing session must not unmount the page and its in-memory form.
  // Initial restoration and failed checks still block access; rejection clears session.
  if ((restoring && !session) || restoreError) return <SessionCheck />;
  if (!session) return <Navigate to="/login" replace />;
  const allowed = accessPath(session.user.rol.nombre);
  if ((location.pathname === '/pedidos' || location.pathname.startsWith('/pedidos/')) && ['Administrador', 'Operador / Técnico'].includes(session.user.rol.nombre)) return <Outlet />;
  if (session.user.rol.nombre === 'Administrador' && (location.pathname === '/usuarios' || location.pathname.startsWith('/usuarios/'))) return <Outlet />;
  if (location.pathname !== allowed) return <Navigate to={allowed} replace />;
  return <Outlet />;
}
