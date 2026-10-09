import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi, ApiError } from '../services/api';
import type { AuthUser } from '../types/auth';
import { AppLayout } from '../layouts/AppLayout';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Link } from 'react-router-dom';
import { AdminSummary } from '../features/admin/AdminSummary';

const adminShortcuts = [
  { title: 'Usuarios y roles', description: 'Administra las cuentas y los permisos del sistema', to: '/usuarios', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /><circle cx="9" cy="7" r="4" /></> },
  { title: 'Registrar pedido', description: 'Registra una nueva solicitud de entrega', to: '/pedidos/nuevo', icon: <><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9v9m-9-13 9 4 9-4M7.5 5.5l9 5" /></> },
  { title: 'Consultar pedidos', description: 'Consulta y revisa los pedidos registrados', to: '/pedidos', icon: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h7m-7 4h7m-7 4h7M7 8h.01M7 12h.01M7 16h.01" /></> },
];

export function AccessPage() {
  const { session, acceptSession } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    authApi.me(controller.signal).then((identity) => {
      if (!controller.signal.aborted) setUser(identity);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) acceptSession(null);
      else setError('No se pudo verificar el acceso. Inténtalo de nuevo.');
    });
    return () => controller.abort();
  }, [session, acceptSession, attempt]);
  // A role refresh can precede this page's identity response. Never expose stale shortcuts.
  const verifiedRole = user?.rol.nombre === session?.user.rol.nombre ? user?.rol.nombre : null;
  const administrator = verifiedRole === 'Administrador';
  return <AppLayout title="Inicio"><section className={`users-panel access-panel${administrator ? ' admin-welcome' : ''}`}>
    <h1>{user ? administrator ? 'Panel de administración' : 'Acceso permitido' : 'Verificando acceso…'}</h1>
    {error ? <><ErrorMessage message={error} /><button className="button button-primary" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Reintentar</button></> : user ? <>
      {administrator ? <>
        <p className="admin-welcome-description">Bienvenido al sistema de gestión logística EcoRuta Huancayo. Desde aquí puedes administrar usuarios y gestionar pedidos.</p>
        <AdminSummary key={user.usuario_id} />
        <nav className="admin-shortcuts" aria-label="Accesos rápidos">{adminShortcuts.map(item => <Link className="admin-shortcut" aria-label={item.title} to={item.to} key={item.to}>
          <span className="admin-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg></span>
          <h2>{item.title}</h2><p>{item.description}</p><span className="admin-shortcut-action" aria-hidden="true">Abrir módulo <span>→</span></span>
        </Link>)}</nav><Link className="button button-primary" to="/vehiculos">Gestionar vehículos</Link>
      </> : <>
      <p>Has iniciado sesión correctamente.</p><dl><dt>Cuenta</dt><dd>{user.email}</dd><dt>Rol</dt><dd>{session?.user.rol.nombre}</dd></dl>
      <div className="access-actions">
      {verifiedRole && ['Administrador', 'Operador / Técnico'].includes(verifiedRole) && <Link className="button button-primary" to="/pedidos/nuevo">Registrar pedido</Link>}
      {verifiedRole && ['Administrador', 'Operador / Técnico'].includes(verifiedRole) && <Link className="button button-primary" to="/pedidos">Consultar pedidos</Link>}
      </div><p className="access-note">Los módulos operativos se incorporarán en los siguientes incrementos.</p></>}
    </> : <p role="status">Comprobando tu identidad con el servidor.</p>}
  </section></AppLayout>;
}
