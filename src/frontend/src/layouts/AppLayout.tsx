import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { LogoutButton } from '../components/LogoutButton';
import { NavIcon, type NavIconName } from '../components/ui/NavIcon';
import { useAuth } from '../hooks/useAuth';
import { useLocationHash } from '../hooks/useLocationHash';
import { DRIVER_SECTIONS, revealDriverSection } from '../features/drivers/driver-sections';
import { accessPath } from '../routes/role-access';

interface NavItem { to: string; label: string; icon: NavIconName; end?: boolean; roles?: string[] }
interface NavGroup { label: string; items: NavItem[] }

const ADMIN = 'Administrador';
const OPERATIONAL = [ADMIN, 'Operador / Técnico'];
// Navegación agrupada por tareas: primero la operación diaria, luego datos maestros y análisis.
const GROUPS: NavGroup[] = [
  { label: 'Operación', items: [
    { to: '/planificacion', label: 'Preparar recorrido', icon: 'plan' },
    { to: '/rutas', label: 'Consultar rutas', icon: 'route' },
    { to: '/seguimiento', label: 'Seguimiento operativo', icon: 'tracking' },
  ] },
  { label: 'Pedidos', items: [
    { to: '/pedidos/nuevo', label: 'Registrar pedido', icon: 'orderAdd' },
    { to: '/pedidos', label: 'Consultar pedidos', icon: 'orders', end: true },
  ] },
  { label: 'Recursos', items: [
    { to: '/conductores', label: 'Conductores', icon: 'drivers' },
    { to: '/disponibilidad', label: 'Disponibilidad', icon: 'calendar' },
    { to: '/vehiculos', label: 'Vehículos', icon: 'truck', roles: [ADMIN] },
  ] },
  { label: 'Análisis', items: [
    { to: '/indicadores', label: 'Indicadores', icon: 'chart' },
    { to: '/historial', label: 'Historial', icon: 'history' },
  ] },
  { label: 'Administración', items: [
    { to: '/usuarios', label: 'Usuarios', icon: 'users', roles: [ADMIN] },
  ] },
];

const initials = (email: string) => email.slice(0, 2).toUpperCase();

export function AppLayout({ children, title, navigationLabel = 'Área autenticada' }: { children: ReactNode; title: string; navigationLabel?: string }) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  const dismissMenu = () => setOpen(false);
  const hash = useLocationHash();
  const groupId = useId();
  // Repetir el ancla actual no emite hashchange: se vuelve a enfocar la sección directamente.
  function followSection(id: string) { dismissMenu(); if (window.location.hash === `#${id}`) revealDriverSection(window.location.hash); }
  const toggle = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const role = session?.user.rol.nombre ?? '';
  const operational = OPERATIONAL.includes(role);
  const email = session?.user.email ?? '';
  function close() { setOpen(false); toggle.current?.focus(); }
  useEffect(() => {
    if (!open) return;
    navigation.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  const visibleGroups = operational ? GROUPS.map(group => ({ ...group, items: group.items.filter(item => !item.roles || item.roles.includes(role)) })).filter(group => group.items.length) : [];
  return <div className={`app-shell${open ? ' menu-open' : ''}`}>
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className="app-sidebar" aria-label="Panel de navegación">
      <div className="sidebar-brand"><BrandLogo /><div><strong>EcoRuta Huancayo</strong><p>Gestión de última milla</p></div></div>
      <nav id="app-navigation" ref={navigation} className="app-navigation" aria-label={navigationLabel}>
        <NavLink onClick={dismissMenu} to={accessPath(role)}><NavIcon name="home" /><span>Acceso</span></NavLink>
        {role === 'Usuario Final / Conductor' && <div className="nav-group" role="group" aria-labelledby={`${groupId}-driver`}>
          <p className="nav-group-label" id={`${groupId}-driver`}>Mi jornada</p>
          {DRIVER_SECTIONS.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={hash === `#${id}` ? 'location' : undefined} onClick={() => followSection(id)}><NavIcon name="dot" /><span>{label}</span></a>)}
        </div>}
        {visibleGroups.map((group, index) => <div key={group.label} className="nav-group" role="group" aria-labelledby={`${groupId}-${index}`}>
          <p className="nav-group-label" id={`${groupId}-${index}`}>{group.label}</p>
          {group.items.map(item => <NavLink key={item.to} onClick={dismissMenu} to={item.to} end={item.end}><NavIcon name={item.icon} /><span>{item.label}</span></NavLink>)}
        </div>)}
      </nav>
      <p className="sidebar-note">Huancayo · Valle del Mantaro</p>
    </aside>
    <div className="app-workspace">
      <header className="app-header">
        <button ref={toggle} className="menu-toggle button button-secondary" aria-expanded={open} aria-controls="app-navigation" onClick={() => open ? close() : setOpen(true)}><NavIcon name={open ? 'close' : 'menu'} /><span>{open ? 'Cerrar menú' : 'Abrir menú'}</span></button>
        <strong className="header-title">{title}</strong>
        <div className="session-identity"><span className="session-avatar" aria-hidden="true">{initials(email)}</span><div className="session-text"><span>{email}</span><strong>{role}</strong></div></div>
        <LogoutButton />
      </header>
      <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
