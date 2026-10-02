import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingButton } from './ui/LoadingButton';
import { ErrorMessage } from './ui/ErrorMessage';
export function LogoutButton() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function closeSession() {
    setLoading(true); setError('');
    try { await logout(); }
    catch { setError('No se pudo cerrar la sesión. Comprueba la conexión y vuelve a intentarlo.'); }
    finally { setLoading(false); }
  }
  return <div className="logout-control">{error && <ErrorMessage message={error} />}<LoadingButton type="button" loading={loading} loadingLabel="Cerrando sesión…" onClick={closeSession}>Cerrar sesión</LoadingButton></div>;
}
