import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { SessionCheck } from '../components/SessionCheck';
import { useAuth } from '../hooks/useAuth';
import { accessPath } from './role-access';

const OPERATIONAL_ROLES = [
  'Administrador',
  'Operador / Técnico',
];

export function ProtectedRoute() {
  const {
    session,
    restoring,
    restoreError,
  } = useAuth();

  const location = useLocation();

  // La revalidación no desmonta una página que ya tiene sesión.
  if (
    (restoring && !session) ||
    restoreError
  ) {
    return <SessionCheck />;
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const role = session.user.rol.nombre;
  const allowed = accessPath(role);

  const operationalRoute =
    location.pathname === '/conductores' ||
    location.pathname.startsWith('/conductores/') ||
    location.pathname === '/disponibilidad' ||
    location.pathname.startsWith('/disponibilidad/') ||
    location.pathname === '/pedidos' ||
    location.pathname.startsWith('/pedidos/');

  if (
    operationalRoute &&
    OPERATIONAL_ROLES.includes(role)
  ) {
    return <Outlet />;
  }

  const administrationRoute =
    location.pathname === '/usuarios' ||
    location.pathname.startsWith('/usuarios/');

  if (
    role === 'Administrador' &&
    administrationRoute
  ) {
    return <Outlet />;
  }

  if (location.pathname !== allowed) {
    return (
      <Navigate
        to={allowed}
        replace
      />
    );
  }

  return <Outlet />;
}
