import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi } from '../services/users-api';
import { ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { RoleOption, UserAccount, UserValues } from '../types/users';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { UserForm } from '../features/users/UserForm';
export function UserEditorPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { acceptSession } = useAuth();
  const [roles, setRoles] = useState<RoleOption[]>([]); const [user, setUser] = useState<UserAccount>(); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    Promise.all([usersApi.roles(controller.signal), id ? usersApi.get(id, controller.signal) : Promise.resolve(undefined)]).then(([items, account]) => {
      if (!controller.signal.aborted) { setRoles(items); setUser(account); }
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) acceptSession(null);
      else setError(cause instanceof Error ? cause.message : 'No se pudo cargar el formulario.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt, acceptSession]);
  async function save(values: UserValues) {
    try { if (id) await usersApi.update(id, values); else await usersApi.create(values); navigate('/usuarios'); }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) acceptSession(null); throw cause; }
  }
  return <section className="users-panel user-editor"><h1>{id ? 'Editar usuario' : 'Crear usuario'}</h1>
    {loading ? <p role="status">Cargando formulario…</p> : error ? <><ErrorMessage message={error} /><button className="button button-secondary" onClick={() => setAttempt(attempt + 1)}>Reintentar</button></> : !roles.length ? <p role="status">No hay roles permitidos disponibles. Revisa la configuración inicial.</p> : <UserForm key={id ?? 'create'} roles={roles} initial={user} onSave={save} />}
  </section>;
}
