import { useAuth } from '../hooks/useAuth';
import { ErrorMessage } from './ui/ErrorMessage';
export function SessionCheck() {
  const { restoreError, retryRestore } = useAuth();
  return <main className="access-layout"><section className="auth-card access-card" aria-busy={!restoreError}>
    <h1>Comprobando sesión…</h1>
    {restoreError ? <><ErrorMessage message={restoreError} /><button className="button button-primary" onClick={retryRestore}>Reintentar</button></> : <p role="status">Verificando tu identidad con el servidor.</p>}
  </section></main>;
}
