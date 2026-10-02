import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../services/users-api';
import { ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { UserAccount } from '../types/users';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StatusBadge } from '../components/ui/StatusBadge';
export function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
  const { acceptSession } = useAuth();
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    usersApi.list(controller.signal).then((items) => { if (!controller.signal.aborted) setUsers(items); }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) acceptSession(null);
      else setError(cause instanceof Error ? cause.message : 'No se pudo consultar usuarios.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt, acceptSession]);
  return <section className="users-panel"><div className="page-heading"><div><h1>Usuarios</h1><p>Administra las cuentas y sus roles de acceso.</p></div><Link className="button button-primary" to="/usuarios/nuevo">Crear usuario</Link></div>
    {!loading && !error && users.length > 0 && <p className="table-hint">Desliza la tabla para ver rol, estado y acciones.</p>}
    {loading ? <p role="status">Cargando usuarios…</p> : error ? <><ErrorMessage message={error} /><button className="button button-secondary" onClick={() => setAttempt(attempt + 1)}>Reintentar</button></> : !users.length ? <p role="status">No hay usuarios registrados.</p> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Listado de usuarios"><table><caption className="sr-only">Cuentas registradas</caption><thead><tr><th scope="col">Correo electrónico</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead><tbody>{users.map((user) => <tr key={user.usuario_id}><td>{user.email}</td><td>{user.rol.nombre}</td><td><StatusBadge state={user.estado} /></td><td><Link className="table-action" to={`/usuarios/${user.usuario_id}/editar`} aria-label={`Editar ${user.email}`}>Editar</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
