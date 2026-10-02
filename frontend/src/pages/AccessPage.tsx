import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi, ApiError } from '../services/api';
import type { AuthUser } from '../types/auth';
import { BrandLogo } from '../components/BrandLogo';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { LogoutButton } from '../components/LogoutButton';
import { Link } from 'react-router-dom';

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
  return <main className="access-layout"><section className="auth-card access-card">
    <BrandLogo /><h1>{user ? 'Acceso permitido' : 'Verificando acceso…'}</h1>
    {error ? <><ErrorMessage message={error} /><button className="button button-primary" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Reintentar</button></> : user ? <>
      <p>Has iniciado sesión correctamente.</p><dl><dt>Cuenta</dt><dd>{user.email}</dd><dt>Rol</dt><dd>{user.rol.nombre}</dd></dl>
      {user.rol.nombre === 'Administrador' && <Link className="button button-primary" to="/usuarios">Usuarios y roles</Link>}
      {['Administrador', 'Operador / Técnico'].includes(user.rol.nombre) && <Link className="button button-primary" to="/pedidos/nuevo">Registrar pedido</Link>}
      {['Administrador', 'Operador / Técnico'].includes(user.rol.nombre) && <Link className="button button-primary" to="/pedidos">Consultar pedidos</Link>}
      <p className="access-note">Los módulos operativos se incorporarán en los siguientes incrementos.</p>
    </> : <p role="status">Comprobando tu identidad con el servidor.</p>}
    <LogoutButton />
  </section></main>;
}
