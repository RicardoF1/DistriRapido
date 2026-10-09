import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../hooks/useAuth';
import { accessPath } from '../routes/role-access';
export function AppLayout({ children, title, navigationLabel = 'Ãrea autenticada' }: { children: ReactNode; title: string; navigationLabel?: string }) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const role = session?.user.rol.nombre ?? '';
  const operational = ['Administrador', 'Operador / TÃ©cnico'].includes(role);
  function close() { setOpen(false); toggle.current?.focus(); }
  useEffect(() => {
    if (!open) return;
    navigation.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  return <div className={`app-shell${open ? ' menu-open' : ''}`}>
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className="app-sidebar" aria-label="Panel de navegaciÃ³n">
      <div className="sidebar-brand"><BrandLogo /><div><strong>EcoRuta Huancayo</strong><p>GestiÃ³n de Ãºltima milla</p></div></div>
      <nav id="app-navigation" ref={navigation} className="app-navigation" aria-label={navigationLabel} onClick={() => setOpen(false)}>
        <NavLink to={accessPath(role)}>Acceso</NavLink>
        {role === 'Administrador' && <NavLink to="/usuarios">Usuarios</NavLink>}
        {operational && <><NavLink to="/conductores">Conductores</NavLink><NavLink to="/disponibilidad">Disponibilidad</NavLink><NavLink to="/pedidos" end>Consultar pedidos</NavLink><NavLink to="/pedidos/nuevo">Registrar pedido</NavLink></>}
      </nav>
      <p className="sidebar-note">Huancayo Â· Valle del Mantaro</p>
    </aside>
    <div className="app-workspace">
      <header className="app-header"><button ref={toggle} className="menu-toggle button button-secondary" aria-expanded={open} aria-controls="app-navigation" onClick={() => open ? close() : setOpen(true)}>{open ? 'Cerrar menÃº' : 'Abrir menÃº'}</button><strong className="header-title">{title}</strong><div className="session-identity"><span>{session?.user.email}</span><strong>{role}</strong></div><LogoutButton /></header>
      <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}

