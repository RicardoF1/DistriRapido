import { Link, Outlet } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../hooks/useAuth';
import { accessPath } from '../routes/role-access';
export function OrderLayout() {
  const { session } = useAuth();
  return <div className="admin-layout"><header className="admin-header"><BrandLogo /><div><strong>Registrar pedido</strong><p>{session?.user.email}</p></div><nav aria-label="Área autenticada"><Link to={accessPath(session!.user.rol.nombre)}>Acceso</Link>{session?.user.rol.nombre === 'Administrador' && <Link to="/usuarios">Usuarios</Link>}<Link to="/pedidos/nuevo">Registrar pedido</Link></nav><LogoutButton /></header><main className="admin-content"><Outlet /></main></div>;
}
