import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { ApiError } from '../../services/api';
import { routesApi } from '../../services/routes-api';
import type { AssignmentCandidate, RouteAssignment } from '../../types/routes';

interface Props {
  routeId: string;
  onAssigned: (result: RouteAssignment) => void;
  onReload: () => void;
  onSessionExpired: () => void;
}
interface PanelError { message: string; reload: boolean }
const messageOf = (cause: unknown, fallback: string) => (cause instanceof Error && cause.message ? cause.message : fallback);

export function RouteAssignmentPanel({ routeId, onAssigned, onReload, onSessionExpired }: Readonly<Props>) {
  const [candidates, setCandidates] = useState<AssignmentCandidate[]>();
  const [selected, setSelected] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PanelError>();
  const sending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setCandidates(undefined);
    setError(undefined);
    routesApi.candidates(routeId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setCandidates(value); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
        else setError({ message: messageOf(cause, 'No se pudieron consultar los conductores elegibles.'), reload: true });
      });
    return () => controller.abort();
  }, [routeId, onSessionExpired]);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !candidates || !selected || !confirmed) return;
    sending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const result = await routesApi.assign(routeId, selected);
      onAssigned(result); // Tras el éxito el panel queda bloqueado hasta que la página lo oculta al recargar.
    } catch (cause) {
      sending.current = false;
      setBusy(false);
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError({ message: messageOf(cause, 'No se pudo asignar la ruta.'), reload: cause instanceof ApiError && cause.status === 409 });
    }
  }

  const ready = candidates !== undefined;
  return <form className="route-assignment" onSubmit={event => void submit(event)} aria-busy={busy}>
    <fieldset disabled={busy}>
      <legend>Asignar conductor</legend>
      {!ready && !error && <p><output>Cargando conductores elegibles…</output></p>}
      <label htmlFor="route-assignment-driver">Conductor</label>
      <select id="route-assignment-driver" value={selected} disabled={!ready || candidates.length === 0} onChange={event => setSelected(event.target.value)}>
        <option value="">Selecciona un conductor</option>
        {candidates?.map(candidate => <option key={candidate.conductor_id} value={candidate.conductor_id}>{candidate.nombre_completo}</option>)}
      </select>
      {ready && candidates.length === 0 && <p>No hay conductores elegibles para esta ruta.</p>}
      <label><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> Confirmo asignar esta ruta al conductor seleccionado.</label>
      <button type="submit" className="button button-primary" disabled={!ready || busy || !selected || !confirmed}>{busy ? 'Asignando…' : 'Asignar ruta'}</button>
    </fieldset>
    {error && <div role="alert"><p>{error.message}</p>{error.reload && <button type="button" className="button button-secondary" onClick={onReload}>Recargar ruta</button>}</div>}
  </form>;
}
