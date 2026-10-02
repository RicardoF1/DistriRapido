import { NavLink, Outlet } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../hooks/useAuth';
export function AdminLayout() {
  const { session } = useAuth();
  return <div className="admin-layout"><header className="admin-header"><BrandLogo /><div><strong>Usuarios y roles</strong><p>{session?.user.email}</p></div>
    <nav aria-label="Administración"><NavLink to="/acceso/administrador">Acceso</NavLink><NavLink to="/usuarios">Usuarios</NavLink><NavLink to="/pedidos">Consultar pedidos</NavLink><NavLink to="/pedidos/nuevo">Registrar pedido</NavLink></nav><LogoutButton /></header>
    <main className="admin-content"><Outlet /></main></div>;
}
