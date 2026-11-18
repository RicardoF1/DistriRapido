import { useRef, useState, type SubmitEvent } from 'react';
import { ApiError } from '../../services/api';
import { routesApi } from '../../services/routes-api';
import type { RouteConfirmation } from '../../types/routes';

interface Props {
  routeId: string;
  pending: string[];
  onConfirmed: (result: RouteConfirmation) => void;
  onReload: () => void;
  onSessionExpired: () => void;
}
interface PanelError { message: string; reload: boolean }

/** US-020: el planificador confirma una ruta revisada para habilitarla para su ejecución. */
export function RouteConfirmationPanel({ routeId, pending, onConfirmed, onReload, onSessionExpired }: Readonly<Props>) {
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PanelError>();
  const sending = useRef(false);
  const blocked = pending.length > 0;

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || blocked || !reviewed) return;
    sending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      onConfirmed(await routesApi.confirm(routeId)); // Tras el éxito el panel queda bloqueado hasta que la página lo oculta al recargar.
    } catch (cause) {
      sending.current = false;
      setBusy(false);
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError({ message: cause instanceof Error && cause.message ? cause.message : 'No se pudo confirmar la ruta.', reload: cause instanceof ApiError && cause.status === 409 });
    }
  }

  return <form className="route-assignment" onSubmit={event => void submit(event)} aria-busy={busy}>
    <fieldset disabled={busy}>
      <legend>Confirmar ruta</legend>
      {blocked
        ? <div role="status"><p>Antes de confirmar resuelve estas condiciones:</p><ul>{pending.map(condition => <li key={condition}>{condition}</li>)}</ul></div>
        : <p>Al confirmarla, la ruta queda habilitada para asignar conductor y ejecutarse.</p>}
      <label><input type="checkbox" checked={reviewed} disabled={blocked} onChange={event => setReviewed(event.target.checked)} /> Revisé el recorrido, las paradas y las advertencias, y confirmo esta ruta para su ejecución.</label>
      <button type="submit" className="button button-primary" disabled={blocked || busy || !reviewed}>{busy ? 'Confirmando…' : 'Confirmar ruta'}</button>
    </fieldset>
    {error && <div role="alert"><p>{error.message}</p>{error.reload && <button type="button" className="button button-secondary" onClick={onReload}>Recargar ruta</button>}</div>}
  </form>;
}
