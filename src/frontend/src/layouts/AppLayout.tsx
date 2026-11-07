import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../hooks/useAuth';
import { useLocationHash } from '../hooks/useLocationHash';
import { DRIVER_SECTIONS, revealDriverSection } from '../features/drivers/driver-sections';
import { accessPath } from '../routes/role-access';
export function AppLayout({ children, title, navigationLabel = 'Área autenticada' }: { children: ReactNode; title: string; navigationLabel?: string }) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  const dismissMenu = () => setOpen(false);
  const hash = useLocationHash();
  // Repetir el ancla actual no emite hashchange: se vuelve a enfocar la sección directamente.
  function followSection(id: string) { dismissMenu(); if (window.location.hash === `#${id}`) revealDriverSection(window.location.hash); }
  const toggle = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const role = session?.user.rol.nombre ?? '';
  const operational = ['Administrador', 'Operador / Técnico'].includes(role);
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
    <aside className="app-sidebar" aria-label="Panel de navegación">
      <div className="sidebar-brand"><BrandLogo /><div><strong>EcoRuta Huancayo</strong><p>Gestión de última milla</p></div></div>
      <nav id="app-navigation" ref={navigation} className="app-navigation" aria-label={navigationLabel}>
        <NavLink onClick={dismissMenu} to={accessPath(role)}>Acceso</NavLink>
        {role === 'Usuario Final / Conductor' && DRIVER_SECTIONS.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={hash === `#${id}` ? 'location' : undefined} onClick={() => followSection(id)}>{label}</a>)}
        {role === 'Administrador' && <NavLink onClick={dismissMenu} to="/usuarios">Usuarios</NavLink>}
        {role === 'Administrador' && <NavLink onClick={dismissMenu} to="/vehiculos">Vehículos</NavLink>}
        {operational && <><NavLink onClick={dismissMenu} to="/rutas">Consultar rutas</NavLink><NavLink onClick={dismissMenu} to="/planificacion">Preparar recorrido</NavLink></>}
        {operational && <><NavLink onClick={dismissMenu} to="/conductores">Conductores</NavLink><NavLink onClick={dismissMenu} to="/disponibilidad">Disponibilidad</NavLink><NavLink onClick={dismissMenu} to="/pedidos" end>Consultar pedidos</NavLink><NavLink onClick={dismissMenu} to="/pedidos/nuevo">Registrar pedido</NavLink></>}
      </nav>
      <p className="sidebar-note">Huancayo · Valle del Mantaro</p>
    </aside>
    <div className="app-workspace">
      <header className="app-header"><button ref={toggle} className="menu-toggle button button-secondary" aria-expanded={open} aria-controls="app-navigation" onClick={() => open ? close() : setOpen(true)}>{open ? 'Cerrar menú' : 'Abrir menú'}</button><strong className="header-title">{title}</strong><div className="session-identity"><span>{session?.user.email}</span><strong>{role}</strong></div><LogoutButton /></header>
      <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}

